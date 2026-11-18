import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { checkCanBorrow, isUniqueViolation, parseCopyId, violatedConstraint } from '@/lib/borrow';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const sessionUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const requestId = Number(id);

    let body: { borrowId?: unknown; studentId?: unknown; copyId?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request', code: 'invalid' }, { status: 400 });
    }

    const borrowId = Number(body.borrowId);
    const studentId = Number(body.studentId);

    // The copy is optional here. The shared rules decide if it is required.
    const copyIdNum = parseCopyId(body.copyId);

    if (
        !Number.isInteger(requestId) ||
        !Number.isInteger(borrowId) ||
        borrowId <= 0 ||
        !Number.isInteger(studentId) ||
        Number.isNaN(copyIdNum)
    ) {
        return NextResponse.json({ error: 'Invalid request', code: 'invalid' }, { status: 400 });
    }

    try {
        const requests = await sql`
      SELECT book_id, status FROM borrow_request WHERE request_id = ${requestId}
    `;

        if (requests.length === 0) {
            return NextResponse.json({ error: 'Request not found', code: 'not_found' }, { status: 404 });
        }

        if (requests[0].status !== 'pending') {
            return NextResponse.json(
                { error: 'Request already handled', code: 'not_pending' },
                { status: 409 }
            );
        }

        const bookId = requests[0].book_id as number;

        const student = await sql`SELECT student_id FROM student WHERE student_id = ${studentId}`;
        if (student.length === 0) {
            return NextResponse.json({ error: 'Student not found', code: 'student_not_found' }, { status: 404 });
        }

        const existing = await sql`SELECT borrow_id FROM borrow WHERE borrow_id = ${borrowId}`;
        if (existing.length > 0) {
            return NextResponse.json(
                { error: `Borrow ID ${borrowId} already exists`, code: 'borrow_id_exists' },
                { status: 409 }
            );
        }

        // The shared rules: is a copy needed, does it belong to this book, is it free?
        const problem = await checkCanBorrow(bookId, copyIdNum);
        if (problem) {
            // The convert form knows these codes: book_taken, copy_required.
            // Anything else is shown as "invalid".
            const code =
                problem.code === 'book_taken' || problem.code === 'copy_required'
                    ? problem.code
                    : 'invalid';
            return NextResponse.json({ error: problem.error, code }, { status: problem.status });
        }

        // Both statements succeed or both are rolled back.
        await sql.transaction([
            sql`
        INSERT INTO borrow (borrow_id, book_id, copy_id, student_id, date_borrow, date_back, flag)
        VALUES (${borrowId}, ${bookId}, ${copyIdNum}, ${studentId}, NOW(), NULL, true)
      `,
            sql`
        UPDATE borrow_request SET status = 'done' WHERE request_id = ${requestId}
      `,
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        // Two saves at the same moment: the database refused the second one (migration 003).
        if (isUniqueViolation(err)) {
            const takenNow = violatedConstraint(err).startsWith('borrow_one_active');
            return NextResponse.json(
                takenNow
                    ? { error: 'This copy is already checked out', code: 'book_taken' }
                    : { error: `Borrow ID ${borrowId} already exists`, code: 'borrow_id_exists' },
                { status: 409 }
            );
        }

        console.error('Failed to convert borrow request:', err);
        return NextResponse.json({ error: 'Failed to convert request', code: 'server' }, { status: 500 });
    }
}