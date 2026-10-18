'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Key } from '@heroui/react';
import { Card, Input, Label, Button, Select, ListBox } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';
import type { RequestText } from '@/lib/i18n-requests';
import type { CopiesText } from '@/lib/i18n-copies';

interface Student {
    student_id: number;
    student_name: string;
}

interface FreeCopy {
    copy_id: number;
}

interface ConvertFormProps {
    requestId: number;
    requesterName: string;
    phone: string;
    note: string | null;
    bookName: string;
    students: Student[];
    copies: FreeCopy[];
    requestedStudentId: number | null;
    matchedStudentId: number | null;
    suggestedBorrowId: number;
    blocked: 'done' | 'borrowed' | null;
    locale: Locale;
    text: RequestText;
    copiesText: CopiesText;
}

export default function ConvertForm({
    requestId,
    requesterName,
    phone,
    note,
    bookName,
    students,
    copies,
    requestedStudentId,
    matchedStudentId,
    suggestedBorrowId,
    blocked,
    locale,
    text,
    copiesText,
}: ConvertFormProps) {
    const router = useRouter();
    const [borrowId, setBorrowId] = useState(String(suggestedBorrowId));
    const [studentId, setStudentId] = useState<Key | null>(matchedStudentId);
    // If only one copy is free, choose it automatically.
    const [copyId, setCopyId] = useState<Key | null>(
        copies.length === 1 ? copies[0].copy_id : null
    );
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!studentId || borrowId.trim() === '') {
            setError(text.convertErrorSelect);
            return;
        }

        if (copies.length > 0 && !copyId) {
            setError(copiesText.noCopyChosen);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/borrow-requests/${requestId}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    borrowId,
                    studentId,
                    copyId: copies.length > 0 ? copyId : null,
                }),
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
            else if (data.code === 'copy_required') setError(copiesText.noCopyChosen);
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
                        {requestedStudentId !== null && (
                            <p className="text-sm text-gray-600">
                                {text.adminStudentId}: <span dir="ltr">{requestedStudentId}</span>
                            </p>
                        )}
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

                                {matchedStudentId !== null ? (
                                    <p className="rounded-xl bg-green-50 text-green-700 text-sm p-3">
                                        ✓ {text.convertMatched}
                                    </p>
                                ) : requestedStudentId !== null ? (
                                    <p className="rounded-xl bg-amber-50 text-amber-700 text-sm p-3">
                                        {text.convertNoMatch}
                                    </p>
                                ) : null}

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

                                {copies.length > 0 && (
                                    <Select selectedKey={copyId} onSelectionChange={setCopyId}>
                                        <Label>{copiesText.chooseCopy}</Label>
                                        <Select.Trigger>
                                            <Select.Value />
                                            <Select.Indicator />
                                        </Select.Trigger>
                                        <Select.Popover>
                                            <ListBox>
                                                {copies.map((copy) => (
                                                    <ListBox.Item
                                                        key={copy.copy_id}
                                                        id={copy.copy_id}
                                                        textValue={`${copiesText.copyId} #${copy.copy_id}`}
                                                    >
                                                        {`${copiesText.copyId} #${copy.copy_id}`}
                                                    </ListBox.Item>
                                                ))}
                                            </ListBox>
                                        </Select.Popover>
                                    </Select>
                                )}

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