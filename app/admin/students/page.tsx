import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';

interface Student {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
}

async function getStudents(): Promise<Student[]> {
    return await sql`
    SELECT student_id, student_name, grade, phone
    FROM student
    ORDER BY student_id ASC
  ` as Student[];
}

export default async function StudentsPage() {
    const students = await getStudents();

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🎒"
                title="Manage Students"
                subtitle="Keep track of your library's young readers"
                action={
                    <Link href="/admin/students/new">
                        <Button>Add Student</Button>
                    </Link>
                }
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                {students.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">
                                No students yet.
                            </p>
                        </Card.Content>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {students.map((student) => (
                            <Card key={student.student_id} className="border-2 border-gray-100">
                                <Card.Content className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            #{student.student_id} — {student.student_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {student.grade ? `Grade ${student.grade}` : 'No grade'}
                                            {student.phone ? ` · ${student.phone}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link href={`/admin/students/${student.student_id}/edit`}>
                                            <Button variant="outline">Edit</Button>
                                        </Link>
                                    </div>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}