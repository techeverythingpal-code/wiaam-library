import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import EditStudentForm from './edit-form';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

interface Student {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
}

async function getStudent(id: string): Promise<Student | undefined> {
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
    const { id } = await params;
    const [student, locale] = await Promise.all([getStudent(id), getLocale()]);

    if (!student) {
        notFound();
    }

    const text = t(locale);

    return (
        <EditStudentForm
            student={student}
            locale={locale}
            text={{ ...text.editStudent, ...text.editBook, ...text.newStudent, saving: text.common.saving }}
        />
    );
}