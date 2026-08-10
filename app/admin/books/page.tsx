import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

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
    const [books, locale] = await Promise.all([getBooks(), getLocale()]);
    const { common, books: booksText } = t(locale);

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="📚"
                title={booksText.title}
                subtitle={booksText.subtitle}
                locale={locale}
                action={
                    <div className="flex items-center gap-3">
                        <Link href="/admin">
                            <Button variant="outline">{common.backToHome}</Button>
                        </Link>
                        <Link href="/admin/books/new">
                            <Button>{common.addBook}</Button>
                        </Link>
                    </div>
                }
            />

            <div className="max-w-5xl mx-auto px-6 py-10">
                {books.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">{booksText.noBooks}</p>
                        </Card.Content>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {books.map((book) => (
                            <Card
                                key={book.book_id}
                                className="border-2 border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <Card.Content className="flex flex-col gap-3">
                                    <div>
                                        <p className="text-xs text-gray-400">#{book.book_id}</p>
                                        <p className="font-semibold text-lg leading-snug">{book.book_name}</p>
                                        <p className="text-sm text-gray-500">{common.by} {book.auther}</p>
                                    </div>
                                    {book.age_group && (
                                        <Chip size="sm" variant="soft">{book.age_group}</Chip>
                                    )}
                                    <Link href={`/admin/books/${book.book_id}/edit`} className="mt-auto">
                                        <Button variant="outline" className="w-full">{common.edit}</Button>
                                    </Link>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}