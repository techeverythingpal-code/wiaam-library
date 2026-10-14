import { sql } from '@/lib/db';
import { Input, Button } from '@heroui/react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Pagination, { PAGE_SIZE } from '@/components/Pagination';
import BookCard from '@/components/BookCard';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getRequestText } from '@/lib/i18n-requests';

interface Book {
  book_id: number;
  book_name: string;
  auther: string;
  age_group: string | null;
  book_cover: string | null;
  is_available: boolean;
}

async function getBookCount(query: string): Promise<number> {
  if (query.trim() === '') {
    const rows = await sql`SELECT COUNT(*)::int AS total FROM book` as { total: number }[];
    return rows[0].total;
  }

  const likeQuery = `%${query}%`;
  const rows = await sql`
    SELECT COUNT(*)::int AS total
    FROM book
    WHERE book_name ILIKE ${likeQuery} OR auther ILIKE ${likeQuery}
  ` as { total: number }[];
  return rows[0].total;
}

async function getBooks(query: string, page: number): Promise<Book[]> {
  const offset = (page - 1) * PAGE_SIZE;

  if (query.trim() === '') {
    return await sql`
      SELECT
        book_id, book_name, auther, age_group, book_cover,
        NOT EXISTS (
          SELECT 1 FROM borrow br
          WHERE br.book_id = book.book_id AND br.flag = true
        ) AS is_available
      FROM book
      ORDER BY book_name ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    ` as Book[];
  }

  const likeQuery = `%${query}%`;
  return await sql`
    SELECT
      book_id, book_name, auther, age_group, book_cover,
      NOT EXISTS (
        SELECT 1 FROM borrow br
        WHERE br.book_id = book.book_id AND br.flag = true
      ) AS is_available
    FROM book
    WHERE book_name ILIKE ${likeQuery} OR auther ILIKE ${likeQuery}
    ORDER BY book_name ASC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  ` as Book[];
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q ?? '';

  const [totalBooks, locale] = await Promise.all([getBookCount(query), getLocale()]);
  const totalPages = Math.max(1, Math.ceil(totalBooks / PAGE_SIZE));
  const requestedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);

  const books = await getBooks(query, currentPage);
  const { home, common } = t(locale);
  const requestText = getRequestText(locale);

  return (
    <main className="min-h-screen">
      <PageHeader
        emoji="📚"
        title="مكان إلنا"
        subtitle={home.subtitle}
        locale={locale}
        action={
          <Link href="/login">
            <Button variant="outline">{home.adminLogin}</Button>
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <form action="/" method="GET" className="mb-8">
          <Input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={home.searchPlaceholder}
          />
        </form>

        {books.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">{home.noBooks}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {books.map((book) => (
                <BookCard
                  key={book.book_id}
                  book={book}
                  isAvailable={book.is_available}
                  byLabel={common.by}
                  text={requestText}
                />
              ))}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              basePath="/"
              locale={locale}
              extraParams={query ? { q: query } : {}}
            />
          </>
        )}
      </div>
    </main>
  );
}