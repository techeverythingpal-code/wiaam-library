import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

async function isAuthenticated() {
    const cookieStore = await cookies();
    const sessionUser = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
    return Boolean(sessionUser);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId)) {
        return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    try {
        await sql`
      UPDATE borrow_request
      SET status = 'done'
      WHERE request_id = ${requestId}
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to update borrow request:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to update request' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const requestId = Number(id);

    if (!Number.isInteger(requestId)) {
        return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    try {
        await sql`
      DELETE FROM borrow_request
      WHERE request_id = ${requestId}
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Failed to delete borrow request:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Failed to delete request' },
            { status: 500 }
        );
    }
}