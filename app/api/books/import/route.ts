import { sql } from '@/lib/db';
import { importHandler, templateResponse, type ImportConfig } from '@/lib/excel-import';

const config: ImportConfig = {
    idKey: 'bookId',
    templateName: 'books-template.xlsx',
    sampleRow: ['2001', 'The Little Prince', 'Antoine de Saint-Exupéry', '6-9', ''],
    columns: [
        { key: 'bookId', label: 'Book ID', aliases: ['book id', 'id', 'رقم الكتاب'], required: true },
        { key: 'bookName', label: 'Title', aliases: ['title', 'book name', 'العنوان', 'اسم الكتاب'], required: true },
        { key: 'auther', label: 'Author', aliases: ['author', 'auther', 'المؤلف'], required: true },
        { key: 'ageGroup', label: 'Age Group', aliases: ['age group', 'الفئة العمرية'], text: true },
        { key: 'bookCover', label: 'Cover URL', aliases: ['cover url', 'cover image url', 'cover', 'رابط صورة الغلاف'] },
    ],
    async findExistingIds(ids) {
        const rows = await sql`
      SELECT book_id FROM book WHERE book_id = ANY(${ids}::int[])
    `;
        return rows.map((r) => Number(r.book_id));
    },
    async insertRows(rows) {
        await sql.transaction(
            rows.map(
                (r) => sql`
          INSERT INTO book (book_id, book_name, auther, age_group, book_cover)
          VALUES (${Number(r.bookId)}, ${r.bookName}, ${r.auther}, ${r.ageGroup || null}, ${r.bookCover || null})
        `
            )
        );
    },
};

export const GET = templateResponse(config);
export const POST = importHandler(config);