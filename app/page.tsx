import { sql } from '@/lib/db';
import { Card, CardBody, CardHeader, Input, Chip } from '@heroui/react';

interface Book {
  book_id: number;
  book_name: string;
  auther: string;
  age_group: string | null;
  book_cover: string | null;
}

async function getBooks(query: string): Promise<Book[]> {
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
    <main className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Village Library</h1>

      <form action="/" method="GET" className="mb-8">
        <Input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search by title or author..."
          size="lg"
        />
      </form>

      {books.length === 0 ? (
        <p className="text-gray-500">No books found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((book) => (
            <Card key={book.book_id}>
              {book.book_cover && (
                <img
                  src={book.book_cover}
                  alt={book.book_name}
                  className="w-full h-48 object-cover"
                />
              )}
              <CardHeader className="flex-col items-start">
                <p className="text-lg font-medium">{book.book_name}</p>
                <p className="text-sm text-gray-500">by {book.auther}</p>
              </CardHeader>
              <CardBody>
                {book.age_group && (
                  <Chip size="sm" variant="flat">{book.age_group}</Chip>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}