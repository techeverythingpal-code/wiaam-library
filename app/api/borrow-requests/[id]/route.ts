import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, serverError } from '@/lib/api';

// Mark a pending request as done (without creating a borrow).
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const requestId = parseId((await params).id);
    if (requestId === null) {
        return apiError('requestNotFound', 404);
    }

    try {
        const updated = await sql`
      UPDATE borrow_request
      SET status = 'done'
      WHERE request_id = ${requestId} AND status = 'pending'
      RETURNING request_id
    `;

        // Nothing changed: the request does not exist, or it was already handled.
        if (updated.length === 0) {
            return apiError('requestNotPending', 409);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to update borrow request', err);
    }
}

// Delete a request (pending or done).
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const requestId = parseId((await params).id);
    if (requestId === null) {
        return apiError('requestNotFound', 404);
    }

    try {
        const deleted = await sql`
      DELETE FROM borrow_request
      WHERE request_id = ${requestId}
      RETURNING request_id
    `;

        if (deleted.length === 0) {
            return apiError('requestNotFound', 404);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to delete borrow request', err);
    }
}