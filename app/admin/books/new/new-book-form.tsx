'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';

interface NewBookText {
    title: string;
    subtitle: string;
    bookId: string;
    bookTitle: string;
    author: string;
    ageGroup: string;
    coverUrl: string;
    adding: string;
    addBook: string;
    failedToAdd: string;
}

export default function NewBookForm({ locale, text }: { locale: Locale; text: NewBookText }) {
    const router = useRouter();
    const [bookId, setBookId] = useState('');
    const [bookName, setBookName] = useState('');
    const [auther, setAuther] = useState('');
    const [ageGroup, setAgeGroup] = useState('');
    const [bookCover, setBookCover] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookId,
                bookName,
                auther,
                ageGroup: ageGroup || null,
                bookCover: bookCover || null,
            }),
        });

        setLoading(false);

        if (res.ok) {
            router.push('/admin/books');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.failedToAdd);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="📚"
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
            />

            <div className="max-w-md mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="bookId">{text.bookId}</Label>
                                <Input
                                    id="bookId"
                                    type="number"
                                    value={bookId}
                                    onChange={(e) => setBookId(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="bookName">{text.bookTitle}</Label>
                                <Input
                                    id="bookName"
                                    type="text"
                                    value={bookName}
                                    onChange={(e) => setBookName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="auther">{text.author}</Label>
                                <Input
                                    id="auther"
                                    type="text"
                                    value={auther}
                                    onChange={(e) => setAuther(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="ageGroup">{text.ageGroup}</Label>
                                <Input
                                    id="ageGroup"
                                    type="text"
                                    value={ageGroup}
                                    onChange={(e) => setAgeGroup(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="bookCover">{text.coverUrl}</Label>
                                <Input
                                    id="bookCover"
                                    type="text"
                                    value={bookCover}
                                    onChange={(e) => setBookCover(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <Button type="submit" isDisabled={loading}>
                                {loading ? text.adding : text.addBook}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}