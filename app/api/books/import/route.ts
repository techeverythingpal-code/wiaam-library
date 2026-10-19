import { sql } from '@/lib/db';
import { importHandler, templateResponse, type ImportConfig } from '@/lib/excel-import';

const MAX_COPIES = 50;

const config: ImportConfig = {
    idKey: 'bookId',
    countKey: 'copyCount',
    maxCount: MAX_COPIES,
    templateName: 'books-template.xlsx',
    sampleRow: ['2001', 'The Little Prince', 'Antoine de Saint-Exupéry', '6-9', '', '3'],
    columns: [
        { key: 'bookId', label: 'Book ID', aliases: ['book id', 'id', 'رقم الكتاب'], required: true },
        { key: 'bookName', label: 'Title', aliases: ['title', 'book name', 'العنوان', 'اسم الكتاب'], required: true },
        { key: 'auther', label: 'Author', aliases: ['author', 'auther', 'المؤلف'], required: true },
        { key: 'ageGroup', label: 'Age Group', aliases: ['age group', 'الفئة العمرية'], text: true },
        { key: 'bookCover', label: 'Cover URL', aliases: ['cover url', 'cover image url', 'cover', 'رابط صورة الغلاف'] },
        { key: 'copyCount', label: 'Number of Copies', aliases: ['number of copies', 'copies', 'copy count', 'عدد النسخ'] },
    ],
    async findExistingIds(ids) {
        const rows = await sql`
      SELECT book_id FROM book WHERE book_id = ANY(${ids}::int[])
    `;
        return rows.map((r) => Number(r.book_id));
    },
    async insertRows(rows) {
        // All books first, then their copies (numbered 1..count).
        // Everything is saved together or not at all.
        await sql.transaction([
            ...rows.map((r) => {
                const count = r.copyCount === '' ? 0 : Number(r.copyCount);
                return sql`
          INSERT INTO book (book_id, book_name, auther, age_group, book_cover, next_copy_number)
          VALUES (${Number(r.bookId)}, ${r.bookName}, ${r.auther}, ${r.ageGroup || null}, ${r.bookCover || null}, ${count + 1})
        `;
            }),
            ...rows
                .filter((r) => r.copyCount !== '' && Number(r.copyCount) > 0)
                .map(
                    (r) => sql`
          INSERT INTO book_copy (book_id, copy_number)
          SELECT ${Number(r.bookId)}::int, g
          FROM generate_series(1, ${Number(r.copyCount)}::int) AS g
        `
                ),
        ]);
    },
};

export const GET = templateResponse(config);
export const POST = importHandler(config);