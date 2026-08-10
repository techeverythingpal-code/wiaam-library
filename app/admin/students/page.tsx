import { sql } from '@/lib/db';
import StudentsView from './students-view';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export interface StudentBorrow {
    borrow_id: number;
    book_name: string;
    date_borrow: string;
    date_back: string | null;
    flag: boolean;
}

export interface StudentWithBorrows {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
    borrows: StudentBorrow[];
}

interface StudentRow {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
    borrow_id: number | null;
    book_name: string | null;
    date_borrow: string | null;
    date_back: string | null;
    flag: boolean | null;
}

async function getStudentsWithBorrows(): Promise<StudentWithBorrows[]> {
    const rows = (await sql`
    SELECT
      s.student_id,
      s.student_name,
      s.grade,
      s.phone,
      b.borrow_id,
      bk.book_name,
      b.date_borrow,
      b.date_back,
      b.flag
    FROM student s
    LEFT JOIN borrow b ON b.student_id = s.student_id
    LEFT JOIN book bk ON bk.book_id = b.book_id
    ORDER BY s.student_id ASC, b.date_borrow DESC
  `) as StudentRow[];

    const studentMap = new Map<number, StudentWithBorrows>();

    for (const row of rows) {
        if (!studentMap.has(row.student_id)) {
            studentMap.set(row.student_id, {
                student_id: row.student_id,
                student_name: row.student_name,
                grade: row.grade,
                phone: row.phone,
                borrows: [],
            });
        }

        if (row.borrow_id !== null) {
            studentMap.get(row.student_id)!.borrows.push({
                borrow_id: row.borrow_id,
                book_name: row.book_name!,
                date_borrow: row.date_borrow!,
                date_back: row.date_back,
                flag: row.flag!,
            });
        }
    }

    return Array.from(studentMap.values());
}

export default async function StudentsPage() {
    const [students, locale] = await Promise.all([getStudentsWithBorrows(), getLocale()]);
    const fullText = t(locale); const text = { ...fullText.students, ...fullText.common };

    return <StudentsView students={students} locale={locale} text={text} />;
}