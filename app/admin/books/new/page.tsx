'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';

export default function NewBookPage() {
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
            setError(data.error ?? 'Failed to add book');
        }
    }

    return (
        <main className="max-w-md mx-auto px-4 py-10">
            <Card>
                <Card.Header>
                    <Card.Title>Add Book</Card.Title>
                </Card.Header>
                <Card.Content>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="bookId">Book ID</Label>
                            <Input
                                id="bookId"
                                type="number"
                                value={bookId}
                                onChange={(e) => setBookId(e.target.value)}
                                required
                            />
                        </div>
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
                        <Button type="submit" isDisabled={loading}>
                            {loading ? 'Adding...' : 'Add Book'}
                        </Button>
                    </form>
                </Card.Content>
            </Card>
        </main>
    );
}