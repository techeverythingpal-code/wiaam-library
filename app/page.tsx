import { sql } from '@/lib/db';
import { Input, Button } from '@heroui/react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Pagination, { PAGE_SIZE } from '@/components/Pagination';
import BookCard from '@/components/BookCard';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getRequestText } from '@/lib/i18n-requests';
import { getCopiesText } from '@/lib/i18n-copies';

interface BookRow {
  book_id: number;
  book_name: string;
  auther: string;
  age_group: string | null;
  book_cover: string | null;
  total_copies: number;
  available_copies: number;
  is_available: boolean;
}

// An empty search ('') matches every book, so one query covers both cases.
async function getBookCount(query: string): Promise<number> {
  const likeQuery = `%${query.trim()}%`;
  const rows = await sql`
    SELECT COUNT(*)::int AS total
    FROM book
    WHERE book_name ILIKE ${likeQuery} OR auther ILIKE ${likeQuery}
  ` as { total: number }[];
  return rows[0].total;
}

// Availability comes from the book_availability view (migrations/004).
async function getBooks(query: string, page: number): Promise<BookRow[]> {
  const offset = (page - 1) * PAGE_SIZE;
  const likeQuery = `%${query.trim()}%`;

  return await sql`
    SELECT
      bk.book_id, bk.book_name, bk.auther, bk.age_group, bk.book_cover,
      a.total_copies, a.available_copies, a.is_available
    FROM book bk
    JOIN book_availability a ON a.book_id = bk.book_id
    WHERE bk.book_name ILIKE ${likeQuery} OR bk.auther ILIKE ${likeQuery}
    ORDER BY bk.book_name ASC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  ` as BookRow[];
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
  const copiesText = getCopiesText(locale);

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
                  totalCopies={book.total_copies}
                  availableCopies={book.available_copies}
                  byLabel={common.by}
                  text={requestText}
                  copiesText={copiesText}
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