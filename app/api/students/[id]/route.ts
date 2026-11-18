import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError } from '@/lib/api';

// Turns "" / null / undefined into null, and trims text.
function optionalText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const studentId = parseId((await params).id);
    if (studentId === null) {
        return apiError('studentNotFound', 404);
    }

    const body = await readJson(request);
    const studentName = optionalText(body.studentName);
    const grade = optionalText(body.grade);
    const phone = optionalText(body.phone);

    if (!studentName) {
        return apiError('studentNameRequired', 400);
    }

    try {
        const updated = await sql`
      UPDATE student
      SET student_name = ${studentName},
          grade = ${grade},
          phone = ${phone}
      WHERE student_id = ${studentId}
      RETURNING student_id
    `;

        // Nothing was updated: the student does not exist (maybe they were just deleted).
        if (updated.length === 0) {
            return apiError('studentNotFound', 404);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to update student', err);
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const studentId = parseId((await params).id);
    if (studentId === null) {
        return apiError('studentNotFound', 404);
    }

    try {
        const activeBorrow = await sql`
      SELECT borrow_id FROM borrow WHERE student_id = ${studentId} AND flag = true
    `;

        if (activeBorrow.length > 0) {
            return apiError('studentBorrowedNow', 409);
        }

        // Cannot delete a student who borrowed before (the loan history must stay correct).
        const history = await sql`
      SELECT borrow_id FROM borrow WHERE student_id = ${studentId} LIMIT 1
    `;

        if (history.length > 0) {
            return apiError('studentHasHistory', 409);
        }

        const deleted = await sql`
      DELETE FROM student WHERE student_id = ${studentId} RETURNING student_id
    `;

        if (deleted.length === 0) {
            return apiError('studentNotFound', 404);
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return serverError('Failed to delete student', err);
    }
}