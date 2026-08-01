'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';

interface Book {
    book_id: number;
    book_name: string;
    auther: string;
    age_group: string | null;
    book_cover: string | null;
}

export default function EditBookForm({ book }: { book: Book }) {
    const router = useRouter();
    const [bookName, setBookName] = useState(book.book_name);
    const [auther, setAuther] = useState(book.auther);
    const [ageGroup, setAgeGroup] = useState(book.age_group ?? '');
    const [bookCover, setBookCover] = useState(book.book_cover ?? '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch(`/api/books/${book.book_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
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
            setError(data.error ?? 'Failed to update book');
        }
    }

    async function handleDelete() {
        if (!confirm(`Delete "${book.book_name}"? This cannot be undone.`)) {
            return;
        }

        setLoading(true);
        const res = await fetch(`/api/books/${book.book_id}`, {
            method: 'DELETE',
        });
        setLoading(false);

        if (res.ok) {
            router.push('/admin/books');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? 'Failed to delete book');
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="📚"
                title={`Edit Book #${book.book_id}`}
                subtitle={book.book_name}
            />

            <div className="max-w-md mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="bookName">Title</Label>
                                <Input
                                    id="bookName"
                                    type="text"
                                    value={bookName}
                                    onChange={(e) => setBookName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="auther">Author</Label>
                                <Input
                                    id="auther"
                                    type="text"
                                    value={auther}
                                    onChange={(e) => setAuther(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="ageGroup">Age Group (optional)</Label>
                                <Input
                                    id="ageGroup"
                                    type="text"
                                    value={ageGroup}
                                    onChange={(e) => setAgeGroup(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="bookCover">Cover Image URL (optional)</Label>
                                <Input
                                    id="bookCover"
                                    type="text"
                                    value={bookCover}
                                    onChange={(e) => setBookCover(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex gap-2">
                                <Button type="submit" isDisabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    isDisabled={loading}
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            </div>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}