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
    const { studentName, grade, phone } = await request.json();

    if (!studentName) {
        return NextResponse.json(
            { error: 'Student name is required' },
            { status: 400 }
        );
    }

    await sql`
    UPDATE student
    SET student_name = ${studentName},
        grade = ${grade},
        phone = ${phone}
    WHERE student_id = ${id}
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
    SELECT borrow_id FROM borrow WHERE student_id = ${id} AND flag = true
  `;

    if (activeBorrow.length > 0) {
        return NextResponse.json(
            { error: 'Cannot delete a student who currently has a book borrowed' },
            { status: 409 }
        );
    }

    await sql`DELETE FROM student WHERE student_id = ${id}`;

    return NextResponse.json({ success: true });
}