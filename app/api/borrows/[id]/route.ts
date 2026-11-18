import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, serverError } from '@/lib/api';

// Mark a borrow as returned.
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const borrowId = parseId((await params).id);
    if (borrowId === null) {
        return apiError('borrowNotActive', 404);
    }

    try {
        const returned = await sql`
      UPDATE borrow
      SET flag = false,
          date_back = NOW()
      WHERE borrow_id = ${borrowId} AND flag = true
      RETURNING borrow_id
    `;

        // Nothing changed: the borrow does not exist, or it was already returned
        // (for example, the button was clicked in two tabs).
        if (returned.length === 0) {
            return apiError('borrowNotActive', 409);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to mark borrow returned', err);
    }
}