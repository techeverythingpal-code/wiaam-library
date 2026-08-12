import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;

    if (!sessionUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await sql`
      UPDATE borrow
      SET flag = false,
          date_back = NOW()
      WHERE borrow_id = ${id}
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to mark borrow returned:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to mark borrow returned' },
            { status: 500 }
        );
    }
}