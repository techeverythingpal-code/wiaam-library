import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { borrowId, bookId, studentId, copyId } = await request.json();

    if (!borrowId || !bookId || !studentId) {
        return NextResponse.json(
            { error: 'Borrow ID, book, and student are required' },
            { status: 400 }
        );
    }

    const hasCopy = copyId !== undefined && copyId !== null && String(copyId).trim() !== '';
    const copyIdNum = hasCopy ? Number(copyId) : null;

    if (hasCopy && !Number.isInteger(copyIdNum)) {
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

        const book = await sql`
      SELECT book_id FROM book WHERE book_id = ${bookId}
    `;

        if (book.length === 0) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const copies = await sql`
      SELECT copy_id FROM book_copy WHERE book_id = ${bookId}
    `;

        if (copies.length > 0) {
            // This book has copies: a specific copy must be chosen.
            if (!hasCopy) {
                return NextResponse.json(
                    { error: 'This book has copies. Choose which copy is borrowed.' },
                    { status: 400 }
                );
            }

            const copyBelongsToBook = copies.some((c) => Number(c.copy_id) === copyIdNum);

            if (!copyBelongsToBook) {
                return NextResponse.json(
                    { error: 'This copy does not belong to this book' },
                    { status: 400 }
                );
            }

            const activeForCopy = await sql`
        SELECT borrow_id FROM borrow WHERE copy_id = ${copyIdNum} AND flag = true
      `;

            if (activeForCopy.length > 0) {
                return NextResponse.json(
                    { error: 'This copy is already checked out' },
                    { status: 409 }
                );
            }
        } else {
            // This book has no copies: it is borrowed as a single item, without a copy ID.
            if (hasCopy) {
                return NextResponse.json(
                    { error: 'This book has no copies' },
                    { status: 400 }
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
        }

        await sql`
      INSERT INTO borrow (borrow_id, book_id, copy_id, student_id, date_borrow, date_back, flag)
      VALUES (${borrowId}, ${bookId}, ${copyIdNum}, ${studentId}, NOW(), NULL, true)
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