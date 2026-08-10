import { sql } from '@/lib/db';
import NewBorrowForm from './new-borrow-form';
import { getLocale, t } from '@/lib/i18n';

interface Student {
    student_id: number;
    student_name: string;
}

interface Book {
    book_id: number;
    book_name: string;
}

async function getAvailableStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name
    FROM student
    ORDER BY student_name ASC
  ` as Student[];
}

async function getAvailableBooks(): Promise<Book[]> {
    return await sql`
    SELECT bk.book_id, bk.book_name
    FROM book bk
    WHERE NOT EXISTS (
      SELECT 1 FROM borrow b
      WHERE b.book_id = bk.book_id AND b.flag = true
    )
    ORDER BY bk.book_name ASC
  ` as Book[];
}

export default async function NewBorrowPage() {
    const [students, books, locale] = await Promise.all([
        getAvailableStudents(),
        getAvailableBooks(),
        getLocale(),
    ]);

    const { newBorrow, common } = t(locale);

    return (
        <NewBorrowForm
            students={students}
            books={books}
            locale={locale}
            text={{ ...newBorrow, saving: common.saving }}
        />
    );
}