import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { studentId, studentName, grade, phone } = await request.json();

    if (!studentId || !studentName) {
        return NextResponse.json(
            { error: 'Student ID and name are required' },
            { status: 400 }
        );
    }

    try {
        const existing = await sql`
      SELECT student_id FROM student WHERE student_id = ${studentId}
    `;

        if (existing.length > 0) {
            return NextResponse.json(
                { error: `Student ID ${studentId} already exists` },
                { status: 409 }
            );
        }

        await sql`
      INSERT INTO student (student_id, student_name, grade, phone)
      VALUES (${studentId}, ${studentName}, ${grade}, ${phone})
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to add student:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to add student' },
            { status: 500 }
        );
    }
}