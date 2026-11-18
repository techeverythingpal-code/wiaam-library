import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError } from '@/lib/api';

// Turns "" / null / undefined into null, and trims text.
function optionalText(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    return text === '' ? null : text;
}

export async function PUT(
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
    const bookName = optionalText(body.bookName);
    const auther = optionalText(body.auther);
    const ageGroup = optionalText(body.ageGroup);
    const bookCover = optionalText(body.bookCover);

    if (!bookName || !auther) {
        return apiError('bookTitleAuthorRequired', 400);
    }

    try {
        const updated = await sql`
      UPDATE book
      SET book_name = ${bookName},
          auther = ${auther},
          age_group = ${ageGroup},
          book_cover = ${bookCover}
      WHERE book_id = ${bookId}
      RETURNING book_id
    `;

        // Nothing was updated: the book does not exist (maybe it was just deleted).
        if (updated.length === 0) {
            return apiError('bookNotFound', 404);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to update book', err);
    }
}

export async function DELETE(
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

    try {
        const activeBorrow = await sql`
      SELECT borrow_id FROM borrow WHERE book_id = ${bookId} AND flag = true
    `;

        if (activeBorrow.length > 0) {
            return apiError('bookBorrowedNow', 409);
        }

        // Cannot delete a book that was borrowed before (the loan history must stay correct).
        // This covers loans of the book itself and loans of any of its copies.
        const history = await sql`
      SELECT borrow_id FROM borrow WHERE book_id = ${bookId} LIMIT 1
    `;

        if (history.length > 0) {
            return apiError('bookHasHistory', 409);
        }

        const deleted = await sql`
      DELETE FROM book WHERE book_id = ${bookId} RETURNING book_id
    `;

        if (deleted.length === 0) {
            return apiError('bookNotFound', 404);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to delete book', err);
    }
}