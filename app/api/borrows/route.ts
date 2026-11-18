import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { checkCanBorrow, isUniqueViolation, parseCopyId, violatedConstraint } from '@/lib/borrow';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { borrowId, bookId, studentId } = body;

    if (!borrowId || !bookId || !studentId) {
        return NextResponse.json(
            { error: 'Borrow ID, book, and student are required' },
            { status: 400 }
        );
    }

    const copyIdNum = parseCopyId(body.copyId);

    if (Number.isNaN(copyIdNum)) {
        return NextResponse.json({ error: 'Invalid copy ID' }, { status: 400 });
    }

    try {
        const existing = await sql`
      SELECT borrow_id FROM borrow WHERE borrow_id = ${borrowId}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: `Borrow ID ${borrowId} already exists` },
                { status: 409 }
            );
        }

        // The shared rules: does the book exist, is a copy needed, is it free?
        const problem = await checkCanBorrow(Number(bookId), copyIdNum);
        if (problem) {
            return NextResponse.json(
                { error: problem.error, code: problem.code },
                { status: problem.status }
            );
        }

        await sql`
      INSERT INTO borrow (borrow_id, book_id, copy_id, student_id, date_borrow, date_back, flag)
      VALUES (${borrowId}, ${bookId}, ${copyIdNum}, ${studentId}, NOW(), NULL, true)
    `;

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

        console.error('Failed to add borrow:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add borrow' },
            { status: 500 }
        );
    }
}