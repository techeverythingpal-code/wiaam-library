'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Key } from '@heroui/react';
import { Card, Input, Label, Button, Select, ListBox } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';
import type { RequestText } from '@/lib/i18n-requests';

interface Student {
    student_id: number;
    student_name: string;
}

interface ConvertFormProps {
    requestId: number;
    requesterName: string;
    phone: string;
    note: string | null;
    bookName: string;
    students: Student[];
    suggestedBorrowId: number;
    blocked: 'done' | 'borrowed' | null;
    locale: Locale;
    text: RequestText;
}

export default function ConvertForm({
    requestId,
    requesterName,
    phone,
    note,
    bookName,
    students,
    suggestedBorrowId,
    blocked,
    locale,
    text,
}: ConvertFormProps) {
    const router = useRouter();
    const [borrowId, setBorrowId] = useState(String(suggestedBorrowId));
    const [studentId, setStudentId] = useState<Key | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!studentId || borrowId.trim() === '') {
            setError(text.convertErrorSelect);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/borrow-requests/${requestId}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ borrowId, studentId }),
            });

            if (res.ok) {
                router.push('/admin/borrows');
                router.refresh();
                return;
            }

            const data = await res.json().catch(() => ({}));
            if (data.code === 'book_taken') setError(text.convertErrorBookTaken);
            else if (data.code === 'borrow_id_exists') setError(text.convertErrorBorrowId);
            else if (data.code === 'not_pending') setError(text.convertErrorNotPending);
            else setError(text.adminFailed);
        } catch {
            setError(text.adminFailed);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔔"
                title={text.convertTitle}
                subtitle={text.convertSubtitle}
                locale={locale}
                action={
                    <Link href="/admin/borrow-requests">
                        <Button variant="outline">{text.convertBack}</Button>
                    </Link>
                }
            />

            <div className="max-w-md mx-auto px-6 py-10 flex flex-col gap-4">
                <Card className="border-2 border-violet-200/60 bg-violet-50/60">
                    <Card.Content className="flex flex-col gap-1">
                        <p className="text-sm text-gray-500">{text.convertBook}</p>
                        <p className="font-semibold">📖 {bookName}</p>
                        <p className="text-sm text-gray-500 mt-2">{text.convertRequester}</p>
                        <p className="font-medium">
                            {requesterName} ·{' '}
                            <span dir="ltr">{phone}</span>
                        </p>
                        {note && <p className="text-sm text-gray-500 mt-1 break-words">“{note}”</p>}
                    </Card.Content>
                </Card>

                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        {blocked === 'done' ? (
                            <p className="text-gray-500 py-6 text-center">{text.convertDoneNotice}</p>
                        ) : blocked === 'borrowed' ? (
                            <p className="text-gray-500 py-6 text-center">
                                {text.convertBookBorrowedNotice}
                            </p>
                        ) : students.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center">{text.convertNoStudents}</p>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="borrowId">{text.convertBorrowId}</Label>
                                    <Input
                                        id="borrowId"
                                        type="number"
                                        value={borrowId}
                                        onChange={(e) => setBorrowId(e.target.value)}
                                        required
                                    />
                                </div>

                                <Select selectedKey={studentId} onSelectionChange={setStudentId}>
                                    <Label>{text.convertStudent}</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {students.map((student) => (
                                                <ListBox.Item
                                                    key={student.student_id}
                                                    id={student.student_id}
                                                    textValue={student.student_name}
                                                >
                                                    {student.student_name}
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>

                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <Button type="submit" isDisabled={loading}>
                                    {loading ? text.adminSaving : text.convertSubmit}
                                </Button>
                            </form>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}