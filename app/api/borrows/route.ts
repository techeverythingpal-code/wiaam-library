import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { borrowId, bookId, studentId } = await request.json();

    if (!borrowId || !bookId || !studentId) {
        return NextResponse.json(
            { error: 'Borrow ID, book, and student are required' },
            { status: 400 }
        );
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

        const activeForBook = await sql`
      SELECT borrow_id FROM borrow WHERE book_id = ${bookId} AND flag = true
    `;

        if (activeForBook.length > 0) {
            return NextResponse.json(
                { error: 'This book is already checked out' },
                { status: 409 }
            );
        }

        await sql`
      INSERT INTO borrow (borrow_id, book_id, student_id, date_borrow, date_back, flag)
      VALUES (${borrowId}, ${bookId}, ${studentId}, NOW(), NULL, true)
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to add borrow:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add borrow' },
            { status: 500 }
        );
    }
}