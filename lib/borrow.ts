import { sql } from '@/lib/db';

// Shared rules for lending a book. Used by:
//   - app/api/borrows/route.ts                      (New Borrow form)
//   - app/api/borrow-requests/[id]/convert/route.ts (turning a request into a borrow)
//   - the New Borrow and convert pages (getNextBorrowId)

export type BorrowErrorCode =
    | 'book_not_found'
    | 'copy_required' // the book has copies, but no copy was chosen
    | 'wrong_copy' // the copy belongs to another book
    | 'no_copies' // a copy was sent, but the book has no copies
    | 'book_taken'; // the copy (or the book) is already checked out

export interface BorrowError {
    code: BorrowErrorCode;
    error: string; // English message (kept for the New Borrow form for now)
    status: number;
}

// Reads "copyId" from a request body. Empty / missing means "no copy".
// Returns NaN when something was sent but it is not a whole number.
export function parseCopyId(value: unknown): number | null {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isInteger(n) ? n : NaN;
}

// The next free borrow ID (highest so far + 1), to fill in the form for the librarian.
// It is only a suggestion: the librarian can change it, and the save still checks
// that the ID is not taken.
export async function getNextBorrowId(): Promise<number> {
    const rows = await sql`
    SELECT COALESCE(MAX(borrow_id), 0)::int + 1 AS next_id FROM borrow
  ` as { next_id: number }[];
    return rows[0].next_id;
}

// Checks that this book (and copy, if any) can be lent right now.
// Returns null when everything is fine, or the reason it cannot be lent.
export async function checkCanBorrow(
    bookId: number,
    copyId: number | null
): Promise<BorrowError | null> {
    const book = await sql`SELECT book_id FROM book WHERE book_id = ${bookId}`;
    if (book.length === 0) {
        return { code: 'book_not_found', error: 'Book not found', status: 404 };
    }

    const copies = await sql`SELECT copy_id FROM book_copy WHERE book_id = ${bookId}`;

    if (copies.length > 0) {
        // This book has copies: a specific copy must be chosen.
        if (copyId === null) {
            return {
                code: 'copy_required',
                error: 'This book has copies. Choose which copy is borrowed.',
                status: 400,
            };
        }

        if (!copies.some((c) => Number(c.copy_id) === copyId)) {
            return {
                code: 'wrong_copy',
                error: 'This copy does not belong to this book',
                status: 400,
            };
        }

        const active = await sql`
      SELECT borrow_id FROM borrow WHERE copy_id = ${copyId} AND flag = true
    `;
        if (active.length > 0) {
            return { code: 'book_taken', error: 'This copy is already checked out', status: 409 };
        }
    } else {
        // This book has no copies: it is borrowed as a single item.
        if (copyId !== null) {
            return { code: 'no_copies', error: 'This book has no copies', status: 400 };
        }

        const active = await sql`
      SELECT borrow_id FROM borrow WHERE book_id = ${bookId} AND flag = true
    `;
        if (active.length > 0) {
            return { code: 'book_taken', error: 'This book is already checked out', status: 409 };
        }
    }

    return null;
}

// Postgres error 23505 = "unique value already exists".
// Since migration 003 this happens when two saves try to lend the same copy
// (or the same book without copies) at the same moment, or reuse a borrow ID.
export function isUniqueViolation(err: unknown): boolean {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === '23505'
    );
}

// Which unique rule was broken (the index / constraint name), if Postgres says.
export function violatedConstraint(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'constraint' in err) {
        return String((err as { constraint?: unknown }).constraint ?? '');
    }
    return '';
}