import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 2000;
const MAX_ID = 2147483647; // Postgres int4

export interface ImportColumn {
    key: string;
    label: string; // header used in the downloadable template
    aliases: string[]; // accepted header names (lowercase, English or Arabic)
    required?: boolean;
    text?: boolean; // force text format in the template (e.g. phone numbers)
}

export type ParsedRow = Record<string, string>;

export interface ImportConfig {
    columns: ImportColumn[];
    idKey: string; // which column is the unique ID
    templateName: string;
    sampleRow: string[];
    findExistingIds: (ids: number[]) => Promise<number[]>;
    insertRows: (rows: ParsedRow[]) => Promise<void>;
    // Optional second ID column (for example a copy ID next to a book ID).
    // It may be empty. When filled, it must be a valid number, unique in the
    // file and not already in the database, otherwise the whole row is skipped.
    secondaryIdKey?: string;
    findExistingSecondaryIds?: (ids: number[]) => Promise<number[]>;
}

type SkipCode = 'exists' | 'duplicateInFile' | 'invalidId' | 'missingRequired';
type ErrorCode = 'noFile' | 'badFile' | 'tooLarge' | 'tooManyRows' | 'missingColumns' | 'empty';

function fail(errorCode: ErrorCode, status: number, detail?: string) {
    return NextResponse.json({ errorCode, detail }, { status });
}

async function isAuthenticated() {
    const cookieStore = await cookies();
    return Boolean(await verifySession(cookieStore.get(SESSION_COOKIE)?.value));
}

function cellToString(value: ExcelJS.CellValue | undefined): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'object') {
        if ('richText' in value) return value.richText.map((r) => r.text).join('').trim();
        if ('result' in value) return value.result == null ? '' : String(value.result).trim();
        if ('text' in value) return String(value.text).trim();
        return '';
    }
    return String(value).trim();
}

// "Age Group (optional)" / "الصف (اختياري)" -> "age group" / "الصف"
function normalizeHeader(h: string): string {
    return h
        .toLowerCase()
        .replace(/\(.*?\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function templateResponse(config: ImportConfig) {
    return async function GET() {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Import');
        sheet.addRow(config.columns.map((c) => (c.required ? c.label : `${c.label} (optional)`)));
        sheet.addRow(config.sampleRow);
        sheet.getRow(1).font = { bold: true };
        config.columns.forEach((c, i) => {
            const col = sheet.getColumn(i + 1);
            col.width = 24;
            if (c.text) col.numFmt = '@';
        });

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(buffer as ArrayBuffer, {
            headers: {
                'Content-Type':
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${config.templateName}"`,
            },
        });
    };
}

export function importHandler(config: ImportConfig) {
    return async function POST(request: Request) {
        if (!(await isAuthenticated())) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        let file: FormDataEntryValue | null;
        try {
            file = (await request.formData()).get('file');
        } catch {
            return fail('noFile', 400);
        }
        if (!(file instanceof File) || file.size === 0) return fail('noFile', 400);
        if (file.size > MAX_FILE_BYTES) return fail('tooLarge', 413);

        // ---- read the sheet ----
        const workbook = new ExcelJS.Workbook();
        try {
            await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as unknown as ExcelJS.Buffer);
        } catch {
            return fail('badFile', 400);
        }
        const sheet = workbook.worksheets[0];
        if (!sheet) return fail('badFile', 400);

        // map header names -> our column keys
        const headerRow = sheet.getRow(1);
        const colIndex = new Map<string, number>(); // key -> column number
        headerRow.eachCell((cell, colNumber) => {
            const header = normalizeHeader(cellToString(cell.value));
            const match = config.columns.find(
                (c) => !colIndex.has(c.key) && c.aliases.includes(header)
            );
            if (match) colIndex.set(match.key, colNumber);
        });

        const missing = config.columns.filter((c) => c.required && !colIndex.has(c.key));
        if (missing.length > 0) {
            return fail('missingColumns', 400, missing.map((c) => c.label).join(', '));
        }

        // ---- collect rows ----
        const parsed: { rowNumber: number; values: ParsedRow }[] = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
            const row = sheet.getRow(r);
            const values: ParsedRow = {};
            for (const c of config.columns) {
                const idx = colIndex.get(c.key);
                values[c.key] = idx ? cellToString(row.getCell(idx).value) : '';
            }
            if (Object.values(values).every((v) => v === '')) continue; // blank row
            parsed.push({ rowNumber: r, values });
        }

        if (parsed.length === 0) return fail('empty', 400);
        if (parsed.length > MAX_ROWS) return fail('tooManyRows', 400);

        // ---- validate ----
        const skipped: { row: number; id: string; code: SkipCode }[] = [];
        const seen = new Set<number>();
        const seenSecondary = new Set<number>();
        const valid: { rowNumber: number; values: ParsedRow }[] = [];

        for (const { rowNumber, values } of parsed) {
            const rawId = values[config.idKey];
            const id = Number(rawId);
            const rawSecondary = config.secondaryIdKey ? values[config.secondaryIdKey] : '';
            const secondary = Number(rawSecondary);

            if (config.columns.some((c) => c.required && !values[c.key])) {
                skipped.push({ row: rowNumber, id: rawId, code: 'missingRequired' });
            } else if (!/^\d+$/.test(rawId) || id < 1 || id > MAX_ID) {
                skipped.push({ row: rowNumber, id: rawId, code: 'invalidId' });
            } else if (seen.has(id)) {
                skipped.push({ row: rowNumber, id: rawId, code: 'duplicateInFile' });
            } else if (
                rawSecondary !== '' &&
                (!/^\d+$/.test(rawSecondary) || secondary < 1 || secondary > MAX_ID)
            ) {
                // The skipped list shows the bad secondary value (for example the copy ID).
                skipped.push({ row: rowNumber, id: rawSecondary, code: 'invalidId' });
            } else if (rawSecondary !== '' && seenSecondary.has(secondary)) {
                skipped.push({ row: rowNumber, id: rawSecondary, code: 'duplicateInFile' });
            } else {
                seen.add(id);
                if (rawSecondary !== '') seenSecondary.add(secondary);
                valid.push({ rowNumber, values });
            }
        }

        // ---- skip IDs already in the database ----
        try {
            const existing = new Set(await config.findExistingIds(valid.map((v) => Number(v.values[config.idKey]))));

            // IDs of the optional second column (for example copy IDs) already in the database
            const secondaryKey = config.secondaryIdKey;
            let existingSecondary = new Set<number>();
            if (secondaryKey && config.findExistingSecondaryIds) {
                const secondaryIds = valid
                    .map((v) => v.values[secondaryKey])
                    .filter((v) => v !== '')
                    .map(Number);
                if (secondaryIds.length > 0) {
                    existingSecondary = new Set(await config.findExistingSecondaryIds(secondaryIds));
                }
            }

            const toInsert: ParsedRow[] = [];
            for (const { rowNumber, values } of valid) {
                const secondaryValue = secondaryKey ? values[secondaryKey] : '';
                if (existing.has(Number(values[config.idKey]))) {
                    skipped.push({ row: rowNumber, id: values[config.idKey], code: 'exists' });
                } else if (secondaryValue !== '' && existingSecondary.has(Number(secondaryValue))) {
                    skipped.push({ row: rowNumber, id: secondaryValue, code: 'exists' });
                } else {
                    toInsert.push(values);
                }
            }

            // all-or-nothing insert of the new rows
            if (toInsert.length > 0) await config.insertRows(toInsert);

            skipped.sort((a, b) => a.row - b.row);
            return NextResponse.json({ imported: toInsert.length, skipped });
        } catch (err) {
            console.error('Excel import failed:', err);
            return NextResponse.json(
                { errorCode: 'failed', detail: err instanceof Error ? err.message : undefined },
                { status: 500 }
            );
        }
    };
}