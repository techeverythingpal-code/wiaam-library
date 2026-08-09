'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

interface ReturnButtonText {
    saving: string;
    markReturned: string;
}

export default function ReturnButton({ borrowId, text }: { borrowId: number; text: ReturnButtonText }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleReturn() {
        setLoading(true);
        await fetch(`/api/borrows/${borrowId}`, { method: 'PUT' });
        setLoading(false);
        router.refresh();
    }

    return (
        <Button size="sm" variant="outline" isDisabled={loading} onClick={handleReturn}>
            {loading ? text.saving : text.markReturned}
        </Button>
    );
}