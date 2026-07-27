import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button } from '@heroui/react';

interface Book {
    book_id: number;
    book_name: string;
    auther: string;
    age_group: string | null;
}

async function getBooks(): Promise<Book[]> {
    return await sql`
    SELECT book_id, book_name, auther, age_group
    FROM book
    ORDER BY book_id ASC
  ` as Book[];
}

export default async function AdminBooksPage() {
    const books = await getBooks();

    return (
        <main className="max-w-4xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold">Manage Books</h1>
                <Link href="/admin/books/new">
                    <Button>Add Book</Button>
                </Link>
            </div>

            {books.length === 0 ? (
                <p className="text-gray-500">No books yet.</p>
            ) : (
                <div className="flex flex-col gap-3">
                    {books.map((book) => (
                        <Card key={book.book_id}>
                            <Card.Content className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        #{book.book_id} — {book.book_name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        by {book.auther}
                                        {book.age_group ? ` · ${book.age_group}` : ''}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={`/admin/books/${book.book_id}/edit`}>
                                        <Button variant="outline">Edit</Button>
                                    </Link>
                                </div>
                            </Card.Content>
                        </Card>
                    ))}
                </div>
            )}
        </main>
    );
}