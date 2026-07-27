import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import EditBookForm from './edit-form';

interface Book {
    book_id: number;
    book_name: string;
    auther: string;
    age_group: string | null;
    book_cover: string | null;
}

async function getBook(id: string): Promise<Book | undefined> {
    const rows = await sql`
    SELECT book_id, book_name, auther, age_group, book_cover
    FROM book
    WHERE book_id = ${id}
  `;
    return rows[0] as Book | undefined;
}

export default async function EditBookPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const book = await getBook(id);

    if (!book) {
        notFound();
    }

    return <EditBookForm book={book} />;
}