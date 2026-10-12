'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@heroui/react';
import { t, type Locale } from '@/lib/i18n';

type Kind = 'students' | 'books';

interface SkippedRow {
    row: number;
    id: string;
    code: 'exists' | 'duplicateInFile' | 'invalidId' | 'missingRequired';
}

interface Result {
    imported: number;
    skipped: SkippedRow[];
}

export default function ImportExcel({ kind, locale }: { kind: Kind; locale: Locale }) {
    const text = t(locale).importExcel;
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState('');

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow choosing the same file again
        if (!file) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const body = new FormData();
            body.append('file', file);
            const res = await fetch(`/api/${kind}/import`, { method: 'POST', body });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const code = data.errorCode as keyof typeof text.errors | undefined;
                const base = (code && text.errors[code]) || text.errors.failed;
                setError(data.detail && code === 'missingColumns' ? `${base} ${data.detail}` : base);
            } else {
                setResult(data as Result);
                router.refresh();
            }
        } catch {
            setError(text.errors.failed);
        } finally {
            setLoading(false);
        }
    }

    const open = result !== null || error !== '';

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFile}
            />
            <Button variant="outline" isDisabled={loading} onClick={() => inputRef.current?.click()}>
                {loading ? text.importing : text.button}
            </Button>
            <a href={`/api/${kind}/import`} className="text-sm text-gray-600 underline whitespace-nowrap">
                {text.template}
            </a>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    dir={locale === 'ar' ? 'rtl' : 'ltr'}
                >
                    <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden">
                        <Card.Content className="flex flex-col gap-4 overflow-y-auto">
                            <h2 className="text-xl font-semibold">{text.resultTitle}</h2>

                            {error && <p className="text-red-600">{error}</p>}

                            {result && (
                                <>
                                    <p>
                                        <span className="font-semibold text-green-700">{result.imported}</span>{' '}
                                        {text.imported}
                                        {' · '}
                                        <span className="font-semibold text-amber-700">{result.skipped.length}</span>{' '}
                                        {text.skipped}
                                    </p>

                                    {result.skipped.length > 0 && (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-start text-gray-500">
                                                    <th className="text-start py-1">{text.row}</th>
                                                    <th className="text-start py-1">{text.id}</th>
                                                    <th className="text-start py-1">{text.reason}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.skipped.map((s) => (
                                                    <tr key={`${s.row}-${s.code}`} className="border-t border-gray-100">
                                                        <td className="py-1">{s.row}</td>
                                                        <td className="py-1">{s.id || '—'}</td>
                                                        <td className="py-1">{text.reasons[s.code]}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}

                            <Button
                                onClick={() => {
                                    setResult(null);
                                    setError('');
                                }}
                            >
                                {text.close}
                            </Button>
                        </Card.Content>
                    </Card>
                </div>
            )}
        </>
    );
}