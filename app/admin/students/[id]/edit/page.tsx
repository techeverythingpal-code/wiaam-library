import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import EditStudentForm from './edit-form';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { parseId } from '@/lib/api';

interface Student {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
}

async function getStudent(id: number): Promise<Student | undefined> {
    const rows = await sql`
    SELECT student_id, student_name, grade, phone
    FROM student
    WHERE student_id = ${id}
  `;
    return rows[0] as Student | undefined;
}

export default async function EditStudentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // "/admin/students/abc/edit" -> the normal "not found" page (not a database error).
    const studentId = parseId((await params).id);
    if (studentId === null) {
        notFound();
    }

    const [student, locale] = await Promise.all([getStudent(studentId), getLocale()]);

    if (!student) {
        notFound();
    }

    const text = t(locale);

    return (
        <EditStudentForm
            student={student}
            locale={locale}
            text={{
                ...text.newStudent,
                ...text.editStudent,
                saving: text.common.saving,
                cancel: text.common.cancel,
            }}
        />
    );
}