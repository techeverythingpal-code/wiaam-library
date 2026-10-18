import { sql } from '@/lib/db';
import NewBorrowForm from './new-borrow-form';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getCopiesText } from '@/lib/i18n-copies';

interface Student {
    student_id: number;
    student_name: string;
}

interface Book {
    book_id: number;
    book_name: string;
}

interface FreeCopy {
    copy_id: number;
    book_id: number;
}

async function getAvailableStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name
    FROM student
    ORDER BY student_name ASC
  ` as Student[];
}

// A book can be borrowed when:
//  - it has copies and at least one copy is free, OR
//  - it has no copies and it is not currently borrowed.
async function getAvailableBooks(): Promise<Book[]> {
    return await sql`
    SELECT bk.book_id, bk.book_name
    FROM book bk
    WHERE EXISTS (
        SELECT 1 FROM book_copy c
        WHERE c.book_id = bk.book_id
          AND NOT EXISTS (
            SELECT 1 FROM borrow b
            WHERE b.copy_id = c.copy_id AND b.flag = true
          )
      )
      OR (
        NOT EXISTS (SELECT 1 FROM book_copy c WHERE c.book_id = bk.book_id)
        AND NOT EXISTS (
          SELECT 1 FROM borrow b
          WHERE b.book_id = bk.book_id AND b.flag = true
        )
      )
    ORDER BY bk.book_name ASC
  ` as Book[];
}

// Only the copies that are free right now.
async function getFreeCopies(): Promise<FreeCopy[]> {
    return await sql`
    SELECT c.copy_id, c.book_id
    FROM book_copy c
    WHERE NOT EXISTS (
      SELECT 1 FROM borrow b
      WHERE b.copy_id = c.copy_id AND b.flag = true
    )
    ORDER BY c.copy_id ASC
  ` as FreeCopy[];
}

export default async function NewBorrowPage() {
    const [students, books, copies, locale] = await Promise.all([
        getAvailableStudents(),
        getAvailableBooks(),
        getFreeCopies(),
        getLocale(),
    ]);

    const { newBorrow, common } = t(locale);

    return (
        <NewBorrowForm
            students={students}
            books={books}
            copies={copies}
            locale={locale}
            text={{ ...newBorrow, saving: common.saving }}
            copiesText={getCopiesText(locale)}
        />
    );
}