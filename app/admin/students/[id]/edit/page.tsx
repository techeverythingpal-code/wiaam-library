import { notFound } from 'next/navigation';
import { sql } from '@/lib/db';
import EditStudentForm from './edit-form';

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
    const student = await getStudent(id);

    if (!student) {
        notFound();
    }

    return <EditStudentForm student={student} />;
}