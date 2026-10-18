import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

async function checkAuth() {
    const cookieStore = await cookies();
    return await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
}

// Add a physical copy to a book (title).
// Body: { copyId: number }  -> the id on the sticker, typed by the librarian
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const sessionUser = await checkAuth();
    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const bookId = Number(id);
    const { copyId } = await request.json();
    const copyIdNum = Number(copyId);

    if (!Number.isInteger(bookId) || !Number.isInteger(copyIdNum) || copyIdNum <= 0) {
        return NextResponse.json(
            { error: 'Copy ID must be a positive whole number' },
            { status: 400 }
        );
    }

    try {
        const book = await sql`
      SELECT book_id FROM book WHERE book_id = ${bookId}
    `;

        if (book.length === 0) {
            return NextResponse.json({ error: 'Book not found' }, { status: 404 });
        }

        const existing = await sql`
      SELECT copy_id FROM book_copy WHERE copy_id = ${copyIdNum}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: `Copy ID ${copyIdNum} already exists` },
                { status: 409 }
            );
        }

        await sql`
      INSERT INTO book_copy (copy_id, book_id)
      VALUES (${copyIdNum}, ${bookId})
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to add copy:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add copy' },
            { status: 500 }
        );
    }
}

// Remove a copy of this book.
// Body: { copyId: number }
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const sessionUser = await checkAuth();
    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const bookId = Number(id);
    const { copyId } = await request.json();
    const copyIdNum = Number(copyId);

    if (!Number.isInteger(bookId) || !Number.isInteger(copyIdNum)) {
        return NextResponse.json({ error: 'Invalid copy ID' }, { status: 400 });
    }

    try {
        // The copy must belong to this book
        const copy = await sql`
      SELECT copy_id FROM book_copy
      WHERE copy_id = ${copyIdNum} AND book_id = ${bookId}
    `;

        if (copy.length === 0) {
            return NextResponse.json({ error: 'Copy not found' }, { status: 404 });
        }

        // Cannot remove a copy that is currently borrowed
        const activeBorrow = await sql`
      SELECT borrow_id FROM borrow WHERE copy_id = ${copyIdNum} AND flag = true
    `;

        if (activeBorrow.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete a copy that is currently borrowed' },
                { status: 409 }
            );
        }

        // Cannot remove a copy that has loan history (the history must stay correct)
        const history = await sql`
      SELECT borrow_id FROM borrow WHERE copy_id = ${copyIdNum} LIMIT 1
    `;

        if (history.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete a copy that has borrow history' },
                { status: 409 }
            );
        }

        await sql`DELETE FROM book_copy WHERE copy_id = ${copyIdNum}`;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to delete copy:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to delete copy' },
            { status: 500 }
        );
    }
}