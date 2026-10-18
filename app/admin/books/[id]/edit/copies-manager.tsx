'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';
import type { CopiesText } from '@/lib/i18n-copies';

interface Copy {
    copy_id: number;
    borrowed: boolean;
}

export default function CopiesManager({
    bookId,
    copies,
    text,
}: {
    bookId: number;
    copies: Copy[];
    text: CopiesText;
}) {
    const router = useRouter();
    const [newCopyId, setNewCopyId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch(`/api/books/${bookId}/copies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ copyId: newCopyId }),
        });

        setLoading(false);

        if (res.ok) {
            setNewCopyId('');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.copyFailed);
        }
    }

    async function handleDelete(copyId: number) {
        if (!confirm(text.confirmDeleteCopy.replace('{id}', String(copyId)))) {
            return;
        }

        setError('');
        setLoading(true);

        const res = await fetch(`/api/books/${bookId}/copies`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ copyId }),
        });

        setLoading(false);

        if (res.ok) {
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.copyFailed);
        }
    }

    return (
        <Card className="border-2 border-gray-100">
            <Card.Header>
                <Card.Title>{text.copiesTitle}</Card.Title>
            </Card.Header>
            <Card.Content>
                <div className="flex flex-col gap-4">
                    {copies.length === 0 ? (
                        <p className="text-sm text-gray-500">{text.noCopies}</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {copies.map((copy) => (
                                <li
                                    key={copy.copy_id}
                                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium">
                                            {text.copyId} #{copy.copy_id}
                                        </span>
                                        <span
                                            className={
                                                copy.borrowed
                                                    ? 'text-xs text-orange-500'
                                                    : 'text-xs text-green-600'
                                            }
                                        >
                                            {copy.borrowed ? text.copyBorrowed : text.copyAvailable}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        isDisabled={loading || copy.borrowed}
                                        onClick={() => handleDelete(copy.copy_id)}
                                    >
                                        {text.deleteCopy}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <form onSubmit={handleAdd} className="flex flex-col gap-2">
                        <Label htmlFor="newCopyId">{text.copyId}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="newCopyId"
                                type="number"
                                value={newCopyId}
                                onChange={(e) => setNewCopyId(e.target.value)}
                                required
                            />
                            <Button type="submit" isDisabled={loading}>
                                {loading ? text.addingCopy : text.addCopy}
                            </Button>
                        </div>
                    </form>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
            </Card.Content>
        </Card>
    );
}