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

    const { bookId, copyId, bookName, auther, ageGroup, bookCover } = await request.json();

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

    // The first copy is optional. Empty means "no copy yet".
    const hasCopy = copyId !== undefined && copyId !== null && String(copyId).trim() !== '';
    const copyIdNum = hasCopy ? Number(copyId) : null;

    if (hasCopy && (!Number.isInteger(copyIdNum) || (copyIdNum as number) <= 0)) {
        return NextResponse.json(
            { error: 'Copy ID must be a positive whole number' },
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

        if (hasCopy) {
            const existingCopy = await sql`
        SELECT copy_id FROM book_copy WHERE copy_id = ${copyIdNum}
      `;

            if (existingCopy.length > 0) {
                return NextResponse.json(
                    { error: `Copy ID ${copyIdNum} already exists` },
                    { status: 409 }
                );
            }

            // Both inserts succeed together, or neither is saved.
            await sql.transaction([
                sql`
          INSERT INTO book (book_id, book_name, auther, age_group, book_cover)
          VALUES (${bookIdNum}, ${bookName}, ${auther}, ${ageGroup}, ${bookCover})
        `,
                sql`
          INSERT INTO book_copy (copy_id, book_id)
          VALUES (${copyIdNum}, ${bookIdNum})
        `,
            ]);
        } else {
            await sql`
        INSERT INTO book (book_id, book_name, auther, age_group, book_cover)
        VALUES (${bookIdNum}, ${bookName}, ${auther}, ${ageGroup}, ${bookCover})
      `;
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to add book:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add book' },
            { status: 500 }
        );
    }
}