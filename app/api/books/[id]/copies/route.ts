import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError } from '@/lib/api';

const MAX_COPIES_AT_ONCE = 50;

// Add copies to a book (title).
// Body: { count?: number }  -> how many copies to add (default 1)
// The system picks the numbers: if the book's next number is 4 and count is 2,
// the new copies are 4 and 5 (labels "bookId-4" and "bookId-5").
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const bookId = parseId((await params).id);
    if (bookId === null) {
        return apiError('bookNotFound', 404);
    }

    const body = await readJson(request);
    const count = body.count === undefined ? 1 : Number(body.count);

    if (!Number.isInteger(count) || count < 1 || count > MAX_COPIES_AT_ONCE) {
        return apiError('addCopiesRange', 400, { max: MAX_COPIES_AT_ONCE });
    }

    try {
        // One statement does both jobs, so it is all-or-nothing:
        //  1) move the book's counter forward by "count" (and read where it was)
        //  2) insert the copies with the numbers that were reserved
        // If two clicks arrive at the same time, the database makes the second
        // wait for the first, so the same number is never given out twice.
        const added = await sql`
      WITH reserved AS (
        UPDATE book
        SET next_copy_number = next_copy_number + ${count}::int
        WHERE book_id = ${bookId}
        RETURNING next_copy_number - ${count}::int AS first_number
      )
      INSERT INTO book_copy (book_id, copy_number)
      SELECT ${bookId}::int, reserved.first_number + g - 1
      FROM reserved, generate_series(1, ${count}::int) AS g
      RETURNING copy_id, copy_number
    `;

        // No book row was updated, so nothing was inserted.
        if (added.length === 0) {
            return apiError('bookNotFound', 404);
        }

        return NextResponse.json({ success: true, copies: added });
    } catch (err) {
        return serverError('Failed to add copy', err);
    }
}

// Remove a copy of this book.
// Body: { copyId: number }
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const bookId = parseId((await params).id);
    const body = await readJson(request);
    const copyId = parseId(body.copyId);

    if (bookId === null || copyId === null) {
        return apiError('copyNotFound', 404);
    }

    try {
        // The copy must belong to this book
        const copy = await sql`
      SELECT copy_id FROM book_copy
      WHERE copy_id = ${copyId} AND book_id = ${bookId}
    `;

        if (copy.length === 0) {
            return apiError('copyNotFound', 404);
        }

        // Cannot remove a copy that is currently borrowed
        const activeBorrow = await sql`
      SELECT borrow_id FROM borrow WHERE copy_id = ${copyId} AND flag = true
    `;

        if (activeBorrow.length > 0) {
            return apiError('copyBorrowedNow', 409);
        }

        // Cannot remove a copy that has loan history (the history must stay correct)
        const history = await sql`
      SELECT borrow_id FROM borrow WHERE copy_id = ${copyId} LIMIT 1
    `;

        if (history.length > 0) {
            return apiError('copyHasHistory', 409);
        }

        await sql`DELETE FROM book_copy WHERE copy_id = ${copyId}`;

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to delete copy', err);
    }
}