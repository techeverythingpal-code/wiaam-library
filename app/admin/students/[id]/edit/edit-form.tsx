'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';

interface Student {
    student_id: number;
    student_name: string;
    grade: string | null;
    phone: string | null;
}

interface EditStudentText {
    titlePrefix: string;
    deleteConfirm: (name: string) => string;
    failedToUpdate: string;
    failedToDelete: string;
    saving: string;
    saveChanges: string;
    delete: string;
    name: string;
    grade: string;
    phone: string;
}

export default function EditStudentForm({ student, locale, text }: { student: Student; locale: Locale; text: EditStudentText }) {
    const router = useRouter();
    const [studentName, setStudentName] = useState(student.student_name);
    const [grade, setGrade] = useState(student.grade ?? '');
    const [phone, setPhone] = useState(student.phone ?? '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch(`/api/students/${student.student_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName,
                grade: grade || null,
                phone: phone || null,
            }),
        });

        setLoading(false);

        if (res.ok) {
            router.push('/admin/students');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.failedToUpdate);
        }
    }

    async function handleDelete() {
        if (!confirm(text.deleteConfirm(student.student_name))) {
            return;
        }

        setLoading(true);
        const res = await fetch(`/api/students/${student.student_id}`, {
            method: 'DELETE',
        });
        setLoading(false);

        if (res.ok) {
            router.push('/admin/students');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.failedToDelete);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🎒"
                title={`${text.titlePrefix}${student.student_id}`}
                subtitle={student.student_name}
                locale={locale}
            />

            <div className="max-w-md mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="studentName">{text.name}</Label>
                                <Input
                                    id="studentName"
                                    type="text"
                                    value={studentName}
                                    onChange={(e) => setStudentName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="grade">{text.grade}</Label>
                                <Input
                                    id="grade"
                                    type="text"
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="phone">{text.phone}</Label>
                                <Input
                                    id="phone"
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex gap-2">
                                <Button type="submit" isDisabled={loading}>
                                    {loading ? text.saving : text.saveChanges}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    isDisabled={loading}
                                    onClick={handleDelete}
                                >
                                    {text.delete}
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}