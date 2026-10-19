import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import Pagination, { PAGE_SIZE } from '@/components/Pagination';
import ReturnButton from './return-button';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getCopiesText, copyLabel } from '@/lib/i18n-copies';
import { formatDate } from '@/lib/format';
interface Borrow {
    borrow_id: number;
    book_id: number;
    copy_number: number | null;
    date_borrow: string;
    date_back: string | null;
    flag: boolean;
    book_name: string;
    student_name: string;
}

async function getBorrowCount(): Promise<number> {
    const rows = await sql`SELECT COUNT(*)::int AS total FROM borrow` as { total: number }[];
    return rows[0].total;
}

async function getBorrows(page: number): Promise<Borrow[]> {
    const offset = (page - 1) * PAGE_SIZE;

    return await sql`
    SELECT
      b.borrow_id,
      b.book_id,
      c.copy_number,
      b.date_borrow,
      b.date_back,
      b.flag,
      bk.book_name,
      s.student_name
    FROM borrow b
    JOIN book bk ON bk.book_id = b.book_id
    JOIN student s ON s.student_id = b.student_id
    LEFT JOIN book_copy c ON c.copy_id = b.copy_id
    ORDER BY b.date_borrow DESC, b.borrow_id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  ` as Borrow[];
}

export default async function BorrowsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const { page } = await searchParams;

    const [totalBorrows, locale] = await Promise.all([getBorrowCount(), getLocale()]);
    const totalPages = Math.max(1, Math.ceil(totalBorrows / PAGE_SIZE));
    const requestedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const currentPage = Math.min(requestedPage, totalPages);

    const borrows = await getBorrows(currentPage);
    const fullText = t(locale); const text = { ...fullText.borrows, ...fullText.common };
    const copiesText = getCopiesText(locale);

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔄"
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
                action={
                    <div className="flex items-center gap-3">
                        <Link href="/admin">
                            <Button variant="outline">{text.backToHome}</Button>
                        </Link>
                        <Link href="/admin/borrows/new">
                            <Button>{text.newBorrow}</Button>
                        </Link>
                    </div>
                }
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                {borrows.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">
                                {text.noBorrows}
                            </p>
                        </Card.Content>
                    </Card>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {borrows.map((borrow) => (
                                <Card key={borrow.borrow_id} className="border-2 border-gray-100">
                                    <Card.Content className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                #{borrow.borrow_id} — {borrow.book_name}
                                                {borrow.copy_number !== null && (
                                                    <span dir="ltr">
                                                        {` · ${copiesText.copy} ${copyLabel(borrow.book_id, borrow.copy_number)}`}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {borrow.student_name} · {text.borrowed}{' '}
                                                {formatDate(borrow.date_borrow, locale)}
                                                {borrow.date_back
                                                    ? ` · ${text.returnedOn} ${formatDate(borrow.date_back, locale)}`
                                                    : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                                {borrow.flag ? text.active : text.returned}
                                            </Chip>
                                            {borrow.flag && (
                                                <ReturnButton
                                                    borrowId={borrow.borrow_id}
                                                    text={{
                                                        saving: text.saving,
                                                        markReturned: text.markReturned,
                                                        failedToReturn: text.failedToReturn,
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </Card.Content>
                                </Card>
                            ))}
                        </div>

                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            basePath="/admin/borrows"
                            locale={locale}
                        />
                    </>
                )}
            </div>
        </main>
    );
}