'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import type { RequestText } from '@/lib/i18n-requests';

interface RequestActionsProps {
    requestId: number;
    isPending: boolean;
    text: RequestText;
}

export default function RequestActions({ requestId, isPending, text }: RequestActionsProps) {
    const router = useRouter();
    const [busy, setBusy] = useState<'done' | 'delete' | null>(null);
    const [error, setError] = useState(false);

    async function run(action: 'done' | 'delete') {
        if (action === 'delete' && !window.confirm(text.adminConfirmDelete)) return;

        setBusy(action);
        setError(false);
        try {
            const res = await fetch(`/api/borrow-requests/${requestId}`, {
                method: action === 'done' ? 'PUT' : 'DELETE',
            });
            if (!res.ok) throw new Error();
            router.refresh();
        } catch {
            setError(true);
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
                {isPending && (
                    <Button
                        size="sm"
                        variant="outline"
                        isDisabled={busy !== null}
                        onClick={() => run('done')}
                    >
                        {busy === 'done' ? text.adminSaving : text.adminMarkDone}
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    isDisabled={busy !== null}
                    onClick={() => run('delete')}
                >
                    {busy === 'delete' ? text.adminSaving : text.adminDelete}
                </Button>
            </div>
            {error && <p className="text-sm text-red-600">{text.adminFailed}</p>}
        </div>
    );
}