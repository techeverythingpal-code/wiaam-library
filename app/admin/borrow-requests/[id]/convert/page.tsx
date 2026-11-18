import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import { getLocale } from '@/lib/i18n-server';
import { getRequestText } from '@/lib/i18n-requests';
import { getCopiesText, copyLabel } from '@/lib/i18n-copies';
import { parseId } from '@/lib/api';
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
    copy_number: number;
}

// is_borrowed means "nothing can be lent right now"
// (the rule is in the book_availability view, migrations/004).
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
      NOT a.is_available AS is_borrowed
    FROM borrow_request r
    JOIN book bk ON bk.book_id = r.book_id
    JOIN book_availability a ON a.book_id = r.book_id
    WHERE r.request_id = ${requestId}
  ` as RequestRow[];
    return rows[0];
}

async function getStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name FROM student ORDER BY student_name ASC
  ` as Student[];
}

// The free copies of this book (free_copy view, migrations/004).
async function getFreeCopies(bookId: number): Promise<FreeCopy[]> {
    return await sql`
    SELECT copy_id, copy_number
    FROM free_copy
    WHERE book_id = ${bookId}
    ORDER BY copy_number ASC
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
    // "/admin/borrow-requests/abc/convert" -> the normal "not found" page.
    const requestId = parseId((await params).id);
    if (requestId === null) notFound();

    const [req, students, suggestedBorrowId, locale] = await Promise.all([
        getRequest(requestId),
        getStudents(),
        getNextBorrowId(),
        getLocale(),
    ]);

    if (!req) notFound();

    const freeCopies = await getFreeCopies(req.book_id);

    // The form only needs the internal id and the label to show ("7-2").
    const copies = freeCopies.map((c) => ({
        copy_id: c.copy_id,
        label: copyLabel(req.book_id, c.copy_number),
    }));

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