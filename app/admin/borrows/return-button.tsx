'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

export default function ReturnButton({ borrowId }: { borrowId: number }) {
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
            {loading ? 'Saving...' : 'Mark Returned'}
        </Button>
    );
}