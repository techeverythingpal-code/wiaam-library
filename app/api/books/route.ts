import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const MAX_COPIES_AT_ONCE = 50;

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { bookId, copyCount, bookName, auther, ageGroup, bookCover } = await request.json();

    if (!bookId || !bookName || !auther) {
        return NextResponse.json(
            { error: 'Book ID, title, and author are required' },
            { status: 400 }
        );
    }

    const bookIdNum = Number(bookId);

    if (!Number.isInteger(bookIdNum) || bookIdNum <= 0) {
        return NextResponse.json(
            { error: 'Book ID must be a positive whole number' },
            { status: 400 }
        );
    }

    // Number of copies is optional. Empty means "no copies yet".
    const hasCount =
        copyCount !== undefined && copyCount !== null && String(copyCount).trim() !== '';
    const count = hasCount ? Number(copyCount) : 0;

    if (!Number.isInteger(count) || count < 0 || count > MAX_COPIES_AT_ONCE) {
        return NextResponse.json(
            { error: `Number of copies must be between 0 and ${MAX_COPIES_AT_ONCE}` },
            { status: 400 }
        );
    }

    try {
        const existingBook = await sql`
      SELECT book_id FROM book WHERE book_id = ${bookIdNum}
    `;

        if (existingBook.length > 0) {
            return NextResponse.json(
                { error: `Book ID ${bookIdNum} already exists` },
                { status: 409 }
            );
        }

        // The book and its copies are saved together, or not at all.
        // Copies are numbered 1..count, and the book remembers the next number.
        await sql.transaction([
            sql`
        INSERT INTO book (book_id, book_name, auther, age_group, book_cover, next_copy_number)
        VALUES (${bookIdNum}, ${bookName}, ${auther}, ${ageGroup}, ${bookCover}, ${count + 1})
      `,
            sql`
        INSERT INTO book_copy (book_id, copy_number)
        SELECT ${bookIdNum}::int, g
        FROM generate_series(1, ${count}::int) AS g
      `,
        ]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to add book:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add book' },
            { status: 500 }
        );
    }
}