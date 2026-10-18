import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getLocale } from '@/lib/i18n-server';
import { getRequestText } from '@/lib/i18n-requests';
import { getCopiesText } from '@/lib/i18n-copies';
import ConvertForm from './convert-form';

interface RequestRow {
    request_id: number;
    book_id: number;
    requester_name: string;
    student_id: number | null;
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

interface FreeCopy {
    copy_id: number;
}

// is_borrowed means "nothing can be lent right now":
//  - book with copies: every copy is out
//  - book without copies: the book itself is out
async function getRequest(requestId: number): Promise<RequestRow | undefined> {
    const rows = await sql`
    SELECT
      r.request_id,
      r.book_id,
      r.requester_name,
      r.student_id,
      r.phone,
      r.note,
      r.status,
      bk.book_name,
      CASE
        WHEN EXISTS (SELECT 1 FROM book_copy c WHERE c.book_id = r.book_id)
        THEN NOT EXISTS (
          SELECT 1 FROM book_copy c
          WHERE c.book_id = r.book_id
            AND NOT EXISTS (
              SELECT 1 FROM borrow b
              WHERE b.copy_id = c.copy_id AND b.flag = true
            )
        )
        ELSE EXISTS (
          SELECT 1 FROM borrow b
          WHERE b.book_id = r.book_id AND b.flag = true
        )
      END AS is_borrowed
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

async function getFreeCopies(bookId: number): Promise<FreeCopy[]> {
    return await sql`
    SELECT c.copy_id
    FROM book_copy c
    WHERE c.book_id = ${bookId}
      AND NOT EXISTS (
        SELECT 1 FROM borrow b
        WHERE b.copy_id = c.copy_id AND b.flag = true
      )
    ORDER BY c.copy_id ASC
  ` as FreeCopy[];
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

    const copies = await getFreeCopies(req.book_id);

    const requestedStudentId = req.student_id;
    const matchedStudentId =
        requestedStudentId !== null &&
        students.some((s) => s.student_id === requestedStudentId)
            ? requestedStudentId
            : null;

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
            copies={copies}
            requestedStudentId={requestedStudentId}
            matchedStudentId={matchedStudentId}
            suggestedBorrowId={suggestedBorrowId}
            blocked={blocked}
            locale={locale}
            text={getRequestText(locale)}
            copiesText={getCopiesText(locale)}
        />
    );
}