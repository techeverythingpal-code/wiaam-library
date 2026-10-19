'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@heroui/react';
import { copyLabel, type CopiesText } from '@/lib/i18n-copies';

interface Copy {
    copy_id: number;
    copy_number: number;
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // The system picks the next number, so there is nothing to type.
    async function handleAdd() {
        setError('');
        setLoading(true);

        const res = await fetch(`/api/books/${bookId}/copies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 1 }),
        });

        setLoading(false);

        if (res.ok) {
            router.refresh();
        } else {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? text.copyFailed);
        }
    }

    async function handleDelete(copy: Copy) {
        const label = copyLabel(bookId, copy.copy_number);

        if (!confirm(text.confirmDeleteCopy.replace('{label}', label))) {
            return;
        }

        setError('');
        setLoading(true);

        const res = await fetch(`/api/books/${bookId}/copies`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ copyId: copy.copy_id }),
        });

        setLoading(false);

        if (res.ok) {
            router.refresh();
        } else {
            const data = await res.json().catch(() => ({}));
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
                                        <span className="font-medium" dir="ltr">
                                            {text.copy} {copyLabel(bookId, copy.copy_number)}
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
                                        onClick={() => handleDelete(copy)}
                                    >
                                        {text.deleteCopy}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Button type="button" isDisabled={loading} onClick={handleAdd}>
                        {loading ? text.addingCopy : text.addCopy}
                    </Button>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
            </Card.Content>
        </Card>
    );
}