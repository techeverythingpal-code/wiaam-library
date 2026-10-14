import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const MAX_ID = 2147483647; // Postgres int4

export async function POST(request: Request) {
    let body: {
        bookId?: unknown;
        studentId?: unknown;
        requesterName?: unknown;
        phone?: unknown;
        note?: unknown;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid request', code: 'invalid' },
            { status: 400 }
        );
    }

    const bookId = Number(body.bookId);
    const studentIdRaw = typeof body.studentId === 'string' ? body.studentId.trim() : String(body.studentId ?? '');
    const studentId = /^\d+$/.test(studentIdRaw) ? Number(studentIdRaw) : NaN;
    const requesterName =
        typeof body.requesterName === 'string' ? body.requesterName.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (
        !Number.isInteger(bookId) ||
        !Number.isInteger(studentId) ||
        studentId < 1 ||
        studentId > MAX_ID ||
        requesterName.length < 2 ||
        requesterName.length > 100 ||
        !PHONE_PATTERN.test(phone) ||
        note.length > 500
    ) {
        return NextResponse.json(
            { error: 'Invalid request', code: 'invalid' },
            { status: 400 }
        );
    }

    try {
        const book = await sql`
      SELECT book_id FROM book WHERE book_id = ${bookId}
    `;

        if (book.length === 0) {
            return NextResponse.json(
                { error: 'Book not found', code: 'book_not_found' },
                { status: 404 }
            );
        }

        const existing = await sql`
      SELECT request_id FROM borrow_request
      WHERE book_id = ${bookId}
        AND (phone = ${phone} OR student_id = ${studentId})
        AND status = 'pending'
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: 'You already requested this book', code: 'duplicate' },
                { status: 409 }
            );
        }

        await sql`
      INSERT INTO borrow_request (book_id, student_id, requester_name, phone, note)
      VALUES (${bookId}, ${studentId}, ${requesterName}, ${phone}, ${note === '' ? null : note})
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to save borrow request:', err);
        return NextResponse.json(
            { error: 'Failed to save request', code: 'server' },
            { status: 500 }
        );
    }
}