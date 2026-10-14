import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import Pagination, { PAGE_SIZE } from '@/components/Pagination';
import RequestActions from './request-actions';
import { getLocale } from '@/lib/i18n-server';
import { getRequestText } from '@/lib/i18n-requests';
import { formatDate } from '@/lib/format';

interface BorrowRequest {
    request_id: number;
    requester_name: string;
    student_id: number | null;
    phone: string;
    note: string | null;
    status: string;
    created_at: string;
    book_name: string;
}

async function getRequestCount(): Promise<number> {
    const rows = await sql`SELECT COUNT(*)::int AS total FROM borrow_request` as { total: number }[];
    return rows[0].total;
}

async function getRequests(page: number): Promise<BorrowRequest[]> {
    const offset = (page - 1) * PAGE_SIZE;

    return await sql`
    SELECT
      r.request_id,
      r.requester_name,
      r.student_id,
      r.phone,
      r.note,
      r.status,
      r.created_at,
      bk.book_name
    FROM borrow_request r
    JOIN book bk ON bk.book_id = r.book_id
    ORDER BY r.created_at DESC, r.request_id DESC
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  ` as BorrowRequest[];
}

export default async function BorrowRequestsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const { page } = await searchParams;

    const [total, locale] = await Promise.all([getRequestCount(), getLocale()]);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const requestedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const currentPage = Math.min(requestedPage, totalPages);

    const requests = await getRequests(currentPage);
    const text = getRequestText(locale);

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="📨"
                title={text.adminTitle}
                subtitle={text.adminSubtitle}
                locale={locale}
                action={
                    <Link href="/admin">
                        <Button variant="outline">{text.adminBackToHome}</Button>
                    </Link>
                }
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                {requests.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">{text.adminNoRequests}</p>
                        </Card.Content>
                    </Card>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            {requests.map((req) => {
                                const isPending = req.status === 'pending';
                                return (
                                    <Card key={req.request_id} className="border-2 border-gray-100">
                                        <Card.Content className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-medium">📖 {req.book_name}</p>
                                                <p className="text-sm text-gray-700 mt-1">
                                                    {req.requester_name}
                                                    {req.student_id !== null && (
                                                        <>
                                                            {' '}· {text.adminStudentId} {req.student_id}
                                                        </>
                                                    )}{' '}
                                                    ·{' '}
                                                    
                                                    <a
                                                        href={`tel:${req.phone}`}
                                                        dir="ltr"
                                                        className="underline"
                                                    >
                                                        {req.phone}
                                                    </a>
                                                </p>
                                                {req.note && (
                                                    <p className="text-sm text-gray-500 mt-1 break-words">
                                                        “{req.note}”
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">
                                                    {text.adminRequestedOn} {formatDate(req.created_at, locale)}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 shrink-0">
                                                <Chip
                                                    size="sm"
                                                    variant="soft"
                                                    color={isPending ? 'warning' : 'success'}
                                                >
                                                    {isPending ? text.adminPending : text.adminDone}
                                                </Chip>
                                                <RequestActions
                                                    requestId={req.request_id}
                                                    isPending={isPending}
                                                    text={text}
                                                />
                                            </div>
                                        </Card.Content>
                                    </Card>
                                );
                            })}
                        </div>

                        <Pagination
                            page={currentPage}
                            totalPages={totalPages}
                            basePath="/admin/borrow-requests"
                            locale={locale}
                        />
                    </>
                )}
            </div>
        </main>
    );
}