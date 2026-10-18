import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

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

    // The copy is optional here. The rules below decide if it is required.
    const hasCopy =
        body.copyId !== undefined && body.copyId !== null && String(body.copyId).trim() !== '';
    const copyIdNum = hasCopy ? Number(body.copyId) : null;

    if (
        !Number.isInteger(requestId) ||
        !Number.isInteger(borrowId) ||
        borrowId <= 0 ||
        !Number.isInteger(studentId) ||
        (hasCopy && !Number.isInteger(copyIdNum))
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

        const copies = await sql`
      SELECT copy_id FROM book_copy WHERE book_id = ${bookId}
    `;

        if (copies.length > 0) {
            // This book has copies: the librarian must choose a free one.
            if (!hasCopy) {
                return NextResponse.json(
                    { error: 'Choose which copy is borrowed', code: 'copy_required' },
                    { status: 400 }
                );
            }

            if (!copies.some((c) => Number(c.copy_id) === copyIdNum)) {
                return NextResponse.json(
                    { error: 'This copy does not belong to this book', code: 'invalid' },
                    { status: 400 }
                );
            }

            const activeForCopy = await sql`
        SELECT borrow_id FROM borrow WHERE copy_id = ${copyIdNum} AND flag = true
      `;
            if (activeForCopy.length > 0) {
                return NextResponse.json(
                    { error: 'This copy is already checked out', code: 'book_taken' },
                    { status: 409 }
                );
            }
        } else {
            // No copies: the book is borrowed as a single item.
            if (hasCopy) {
                return NextResponse.json(
                    { error: 'This book has no copies', code: 'invalid' },
                    { status: 400 }
                );
            }

            const activeForBook = await sql`
        SELECT borrow_id FROM borrow WHERE book_id = ${bookId} AND flag = true
      `;
            if (activeForBook.length > 0) {
                return NextResponse.json(
                    { error: 'This book is already checked out', code: 'book_taken' },
                    { status: 409 }
                );
            }
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
        console.error('Failed to convert borrow request:', err);
        return NextResponse.json({ error: 'Failed to convert request', code: 'server' }, { status: 500 });
    }
}