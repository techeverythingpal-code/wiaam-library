'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';

interface NewStudentText {
    title: string;
    subtitle: string;
    studentId: string;
    name: string;
    grade: string;
    phone: string;
    adding: string;
    addStudent: string;
    failedToAdd: string;
}

export default function NewStudentForm({ locale, text }: { locale: Locale; text: NewStudentText }) {
    const router = useRouter();
    const [studentId, setStudentId] = useState('');
    const [studentName, setStudentName] = useState('');
    const [grade, setGrade] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch('/api/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId,
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
            setError(data.error ?? text.failedToAdd);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🎒"
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
            />

            <div className="max-w-md mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="studentId">{text.studentId}</Label>
                                <Input
                                    id="studentId"
                                    type="number"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    required
                                />
                            </div>
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
                            <Button type="submit" isDisabled={loading}>
                                {loading ? text.adding : text.addStudent}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}