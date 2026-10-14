import Link from 'next/link';
import { Button } from '@heroui/react';
import type { Locale } from '@/lib/i18n';

export const PAGE_SIZE = 9;

const text = {
    en: { previous: 'Previous', next: 'Next', page: 'Page', of: 'of' },
    ar: { previous: 'السابق', next: 'التالي', page: 'صفحة', of: 'من' },
} as const;

interface PaginationProps {
    page: number;
    totalPages: number;
    basePath: string;
    locale: Locale;
    extraParams?: Record<string, string>;
}

function buildHref(
    basePath: string,
    page: number,
    extraParams: Record<string, string>
) {
    const params = new URLSearchParams(extraParams);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({
    page,
    totalPages,
    basePath,
    locale,
    extraParams = {},
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const labels = text[locale];
    const hasPrevious = page > 1;
    const hasNext = page < totalPages;

    return (
        <nav className="flex items-center justify-center gap-4 mt-10">
            {hasPrevious ? (
                <Link href={buildHref(basePath, page - 1, extraParams)}>
                    <Button variant="outline" size="sm">
                        {labels.previous}
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" size="sm" isDisabled>
                    {labels.previous}
                </Button>
            )}

            <span className="text-sm text-gray-500">
                {labels.page} {page} {labels.of} {totalPages}
            </span>

            {hasNext ? (
                <Link href={buildHref(basePath, page + 1, extraParams)}>
                    <Button variant="outline" size="sm">
                        {labels.next}
                    </Button>
                </Link>
            ) : (
                <Button variant="outline" size="sm" isDisabled>
                    {labels.next}
                </Button>
            )}
        </nav>
    );
}