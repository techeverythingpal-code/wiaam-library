'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Key } from '@heroui/react';
import { Card, Input, Label, Button, Select, ListBox } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';

interface Student {
    student_id: number;
    student_name: string;
}

interface Book {
    book_id: number;
    book_name: string;
}

interface NewBorrowText {
    title: string;
    subtitle: string;
    noBooksAvailable: string;
    noStudents: string;
    borrowId: string;
    book: string;
    student: string;
    selectBoth: string;
    checkOutBook: string;
    failedToCreate: string;
    saving: string;
}

export default function NewBorrowForm({
    students,
    books,
    locale,
    text,
}: {
    students: Student[];
    books: Book[];
    locale: Locale;
    text: NewBorrowText;
}) {
    const router = useRouter();
    const [borrowId, setBorrowId] = useState('');
    const [bookId, setBookId] = useState<Key | null>(null);
    const [studentId, setStudentId] = useState<Key | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (!bookId || !studentId) {
            setError(text.selectBoth);
            return;
        }

        setLoading(true);

        const res = await fetch('/api/borrows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borrowId, bookId, studentId }),
        });

        setLoading(false);

        if (res.ok) {
            router.push('/admin/borrows');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.failedToCreate);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔄"
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
            />

            <div className="max-w-md mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        {books.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center">
                                {text.noBooksAvailable}
                            </p>
                        ) : students.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center">
                                {text.noStudents}
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1">
                                    <Label htmlFor="borrowId">{text.borrowId}</Label>
                                    <Input
                                        id="borrowId"
                                        type="number"
                                        value={borrowId}
                                        onChange={(e) => setBorrowId(e.target.value)}
                                        required
                                    />
                                </div>

                                <Select
                                    selectedKey={bookId}
                                    onSelectionChange={setBookId}
                                >
                                    <Label>{text.book}</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {books.map((book) => (
                                                <ListBox.Item
                                                    key={book.book_id}
                                                    id={book.book_id}
                                                    textValue={book.book_name}
                                                >
                                                    {book.book_name}
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>

                                <Select
                                    selectedKey={studentId}
                                    onSelectionChange={setStudentId}
                                >
                                    <Label>{text.student}</Label>
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
                                    {loading ? text.saving : text.checkOutBook}
                                </Button>
                            </form>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}