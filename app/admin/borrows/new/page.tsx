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
    copy_number: number;
}

async function getAvailableStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name
    FROM student
    ORDER BY student_name ASC
  ` as Student[];
}

// Books that can be lent right now (rule in the book_availability view, migrations/004).
async function getAvailableBooks(): Promise<Book[]> {
    return await sql`
    SELECT bk.book_id, bk.book_name
    FROM book bk
    JOIN book_availability a ON a.book_id = bk.book_id
    WHERE a.is_available
    ORDER BY bk.book_name ASC
  ` as Book[];
}

// Only the copies that are free right now (free_copy view, migrations/004).
async function getFreeCopies(): Promise<FreeCopy[]> {
    return await sql`
    SELECT copy_id, book_id, copy_number
    FROM free_copy
    ORDER BY book_id ASC, copy_number ASC
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