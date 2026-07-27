import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { bookId, bookName, auther, ageGroup, bookCover } = await request.json();

    if (!bookId || !bookName || !auther) {
        return NextResponse.json(
            { error: 'Book ID, title, and author are required' },
            { status: 400 }
        );
    }

    const existing = await sql`
    SELECT book_id FROM book WHERE book_id = ${bookId}
  `;

    if (existing.length > 0) {
        return NextResponse.json(
            { error: `Book ID ${bookId} already exists` },
            { status: 409 }
        );
    }

    await sql`
    INSERT INTO book (book_id, book_name, auther, age_group, book_cover)
    VALUES (${bookId}, ${bookName}, ${auther}, ${ageGroup}, ${bookCover})
  `;

    return NextResponse.json({ success: true });
}