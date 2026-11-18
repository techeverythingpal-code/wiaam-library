import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { apiError, isAdmin, parseId, readJson, serverError, type ApiErrorCode } from '@/lib/api';
import {
    checkCanBorrow,
    isUniqueViolation,
    parseCopyId,
    violatedConstraint,
    type BorrowErrorCode,
} from '@/lib/borrow';

// The shared borrow rules (lib/borrow.ts) -> the message to show.
const BORROW_MESSAGES: Record<BorrowErrorCode, ApiErrorCode> = {
    book_not_found: 'bookNotFound',
    copy_required: 'copyRequired',
    wrong_copy: 'wrongCopy',
    no_copies: 'noCopies',
    book_taken: 'bookTaken',
};

export async function POST(request: Request) {
    if (!(await isAdmin())) {
        return apiError('notAuthenticated', 401);
    }

    const body = await readJson(request);

    if (!body.borrowId || !body.bookId || !body.studentId) {
        return apiError('borrowFieldsRequired', 400);
    }

    const borrowId = parseId(body.borrowId);
    const bookId = parseId(body.bookId);
    const studentId = parseId(body.studentId);
    const copyId = parseCopyId(body.copyId);

    if (borrowId === null) {
        return apiError('borrowIdInvalid', 400);
    }

    if (bookId === null || studentId === null || Number.isNaN(copyId)) {
        return apiError('invalidRequest', 400);
    }

    try {
        const existing = await sql`
      SELECT borrow_id FROM borrow WHERE borrow_id = ${borrowId}
    `;

        if (existing.length > 0) {
            return apiError('borrowIdExists', 409, { id: borrowId });
        }

        const student = await sql`
      SELECT student_id FROM student WHERE student_id = ${studentId}
    `;

        if (student.length === 0) {
            return apiError('studentNotFound', 404);
        }

        // The shared rules: does the book exist, is a copy needed, is it free?
        const problem = await checkCanBorrow(bookId, copyId);
        if (problem) {
            const message =
                problem.code === 'book_taken' && copyId !== null
                    ? 'copyTaken'
                    : BORROW_MESSAGES[problem.code];
            return apiError(message, problem.status);
        }

        await sql`
      INSERT INTO borrow (borrow_id, book_id, copy_id, student_id, date_borrow, date_back, flag)
      VALUES (${borrowId}, ${bookId}, ${copyId}, ${studentId}, NOW(), NULL, true)
    `;

        return NextResponse.json({ success: true });
    } catch (err) {
        // Two saves at the same moment: the database refused the second one (migration 003).
        if (isUniqueViolation(err)) {
            if (violatedConstraint(err).startsWith('borrow_one_active')) {
                return apiError(copyId !== null ? 'copyTaken' : 'bookTaken', 409);
            }
            return apiError('borrowIdExists', 409, { id: borrowId });
        }

        return serverError('Failed to add borrow', err);
    }
}