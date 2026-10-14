import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getLocale } from '@/lib/i18n-server';
import { getRequestText } from '@/lib/i18n-requests';
import ConvertForm from './convert-form';

interface RequestRow {
    request_id: number;
    requester_name: string;
    phone: string;
    note: string | null;
    status: string;
    book_name: string;
    is_borrowed: boolean;
}

interface Student {
    student_id: number;
    student_name: string;
}

async function getRequest(requestId: number): Promise<RequestRow | undefined> {
    const rows = await sql`
    SELECT
      r.request_id,
      r.requester_name,
      r.phone,
      r.note,
      r.status,
      bk.book_name,
      EXISTS (
        SELECT 1 FROM borrow b WHERE b.book_id = r.book_id AND b.flag = true
      ) AS is_borrowed
    FROM borrow_request r
    JOIN book bk ON bk.book_id = r.book_id
    WHERE r.request_id = ${requestId}
  ` as RequestRow[];
    return rows[0];
}

async function getStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name FROM student ORDER BY student_name ASC
  ` as Student[];
}

async function getNextBorrowId(): Promise<number> {
    const rows = await sql`
    SELECT COALESCE(MAX(borrow_id), 0)::int + 1 AS next_id FROM borrow
  ` as { next_id: number }[];
    return rows[0].next_id;
}

export default async function ConvertRequestPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isInteger(requestId)) notFound();

    const [req, students, suggestedBorrowId, locale] = await Promise.all([
        getRequest(requestId),
        getStudents(),
        getNextBorrowId(),
        getLocale(),
    ]);

    if (!req) notFound();

    const blocked =
        req.status !== 'pending' ? 'done' : req.is_borrowed ? 'borrowed' : null;

    return (
        <ConvertForm
            requestId={req.request_id}
            requesterName={req.requester_name}
            phone={req.phone}
            note={req.note}
            bookName={req.book_name}
            students={students}
            suggestedBorrowId={suggestedBorrowId}
            blocked={blocked}
            locale={locale}
            text={getRequestText(locale)}
        />
    );
}