import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

async function checkAuth() {
    const cookieStore = await cookies();
    return cookieStore.get('session_user')?.value;
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const sessionUser = await checkAuth();
    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { bookName, auther, ageGroup, bookCover } = await request.json();

    if (!bookName || !auther) {
        return NextResponse.json(
            { error: 'Title and author are required' },
            { status: 400 }
        );
    }

    await sql`
    UPDATE book
    SET book_name = ${bookName},
        auther = ${auther},
        age_group = ${ageGroup},
        book_cover = ${bookCover}
    WHERE book_id = ${id}
  `;

    return NextResponse.json({ success: true });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const sessionUser = await checkAuth();
    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const activeBorrow = await sql`
    SELECT borrow_id FROM borrow WHERE book_id = ${id} AND flag = true
  `;

    if (activeBorrow.length > 0) {
        return NextResponse.json(
            { error: 'Cannot delete a book that is currently borrowed' },
            { status: 409 }
        );
    }

    await sql`DELETE FROM book WHERE book_id = ${id}`;

    return NextResponse.json({ success: true });
}