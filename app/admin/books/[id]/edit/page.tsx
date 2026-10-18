import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import EditBookForm from './edit-form';
import CopiesManager from './copies-manager';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getCopiesText } from '@/lib/i18n-copies';

interface Book {
    book_id: number;
    book_name: string;
    auther: string;
    age_group: string | null;
    book_cover: string | null;
}

interface Copy {
    copy_id: number;
    borrowed: boolean;
}

async function getBook(id: string): Promise<Book | undefined> {
    const rows = await sql`
    SELECT book_id, book_name, auther, age_group, book_cover
    FROM book
    WHERE book_id = ${id}
  `;
    return rows[0] as Book | undefined;
}

async function getCopies(id: string): Promise<Copy[]> {
    const rows = await sql`
    SELECT
      c.copy_id,
      EXISTS (
        SELECT 1 FROM borrow b
        WHERE b.copy_id = c.copy_id AND b.flag = true
      ) AS borrowed
    FROM book_copy c
    WHERE c.book_id = ${id}
    ORDER BY c.copy_id ASC
  `;
    return rows as Copy[];
}

export default async function EditBookPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [book, copies, locale] = await Promise.all([
        getBook(id),
        getCopies(id),
        getLocale(),
    ]);

    if (!book) {
        notFound();
    }

    const text = t(locale);

    return (
        <EditBookForm
            book={book}
            locale={locale}
            text={{
                ...text.newBook,
                ...text.editBook,
                saving: text.common.saving,
                cancel: text.common.cancel,
            }}
        >
            <CopiesManager
                bookId={book.book_id}
                copies={copies}
                text={getCopiesText(locale)}
            />
        </EditBookForm>
    );
}