import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError } from '@/lib/api';
import { isUniqueViolation } from '@/lib/borrow';

const MAX_COPIES_AT_ONCE = 50;

// Turns "" / null / undefined into null, and trims text.
function optionalText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    return text === '' ? null : text;
}

export async function POST(request: Request) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const body = await readJson(request);
    const bookName = optionalText(body.bookName);
    const auther = optionalText(body.auther);
    const ageGroup = optionalText(body.ageGroup);
    const bookCover = optionalText(body.bookCover);

    if (!body.bookId || !bookName || !auther) {
        return apiError('bookFieldsRequired', 400);
    }

    const bookIdNum = parseId(body.bookId);

    if (bookIdNum === null) {
        return apiError('bookIdInvalid', 400);
    }

    // Number of copies is optional. Empty means "no copies yet".
    const rawCount = body.copyCount;
    const hasCount =
        rawCount !== undefined && rawCount !== null && String(rawCount).trim() !== '';
    const count = hasCount ? Number(rawCount) : 0;

    if (!Number.isInteger(count) || count < 0 || count > MAX_COPIES_AT_ONCE) {
        return apiError('copyCountRange', 400, { max: MAX_COPIES_AT_ONCE });
    }

    try {
        const existingBook = await sql`
      SELECT book_id FROM book WHERE book_id = ${bookIdNum}
    `;

        if (existingBook.length > 0) {
            return apiError('bookIdExists', 409, { id: bookIdNum });
        }

        // The book and its copies are saved together, or not at all.
        // Copies are numbered 1..count, and the book remembers the next number.
        await sql.transaction([
            sql`
        INSERT INTO book (book_id, book_name, auther, age_group, book_cover, next_copy_number)
        VALUES (${bookIdNum}, ${bookName}, ${auther}, ${ageGroup}, ${bookCover}, ${count + 1})
      `,
            sql`
        INSERT INTO book_copy (book_id, copy_number)
        SELECT ${bookIdNum}::int, g
        FROM generate_series(1, ${count}::int) AS g
      `,
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        // Someone saved the same Book ID a moment earlier.
        if (isUniqueViolation(err)) {
            return apiError('bookIdExists', 409, { id: bookIdNum });
        }
        return serverError('Failed to add book', err);
    }
}