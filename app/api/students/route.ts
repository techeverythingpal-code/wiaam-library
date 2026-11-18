import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError } from '@/lib/api';
import { isUniqueViolation } from '@/lib/borrow';

// Turns "" / null / undefined into null, and trims text.
function optionalText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const text = String(value).trim();
    return text === '' ? null : text;
}

export async function POST(request: Request) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const body = await readJson(request);
    const studentName = optionalText(body.studentName);
    const grade = optionalText(body.grade);
    const phone = optionalText(body.phone);

    if (!body.studentId || !studentName) {
        return apiError('studentFieldsRequired', 400);
    }

    const studentId = parseId(body.studentId);
    if (studentId === null) {
        return apiError('studentIdInvalid', 400);
    }

    try {
        const existing = await sql`
      SELECT student_id FROM student WHERE student_id = ${studentId}
    `;

        if (existing.length > 0) {
            return apiError('studentIdExists', 409, { id: studentId });
        }

        await sql`
      INSERT INTO student (student_id, student_name, grade, phone)
      VALUES (${studentId}, ${studentName}, ${grade}, ${phone})
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        // Someone saved the same Student ID a moment earlier.
        if (isUniqueViolation(err)) {
            return apiError('studentIdExists', 409, { id: studentId });
        }
        return serverError('Failed to add student', err);
    }
}