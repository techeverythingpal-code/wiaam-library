import { sql } from '@/lib/db';
import { Card, Input, Chip, Button } from '@heroui/react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface Book {
  book_id: number;
  book_name: string;
  auther: string;
  age_group: string | null;
  book_cover: string | null;
}

async function getBooks(query: string): Promise<Book[]> {
  await new Promise(resolve => setTimeout(resolve, 1000)); // TEMP: force 3s delay to test loading screen
  if (query.trim() === '') {
    return await sql`
      SELECT book_id, book_name, auther, age_group, book_cover
      FROM book
      ORDER BY book_name ASC
    ` as Book[];
  }

  const likeQuery = `%${query}%`;
  return await sql`
    SELECT book_id, book_name, auther, age_group, book_cover
    FROM book
    WHERE book_name ILIKE ${likeQuery} OR auther ILIKE ${likeQuery}
    ORDER BY book_name ASC
  ` as Book[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? '';
  const books = await getBooks(query);

  return (
    <main className="min-h-screen">
      <PageHeader
        emoji="📚"
        title="مكان إلنا"
        subtitle="Browse and discover books for kids"
        action={
          <Link href="/login">
            <Button variant="outline">Admin Login</Button>
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <form action="/" method="GET" className="mb-8">
          <Input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by title or author..."
          />
        </form>

        {books.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">No books found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card
                key={book.book_id}
                className="border-2 border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                {book.book_cover && (
                  <img
                    src={book.book_cover}
                    alt={book.book_name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <Card.Header>
                  <Card.Title>{book.book_name}</Card.Title>
                  <Card.Description>by {book.auther}</Card.Description>
                </Card.Header>
                <Card.Content>
                  {book.age_group && (
                    <Chip size="sm" variant="soft">{book.age_group}</Chip>
                  )}
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}