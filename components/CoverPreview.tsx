'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n';

export default function CoverPreview({
    url,
    alt,
    locale,
}: {
    url: string;
    alt: string;
    locale: Locale;
}) {
    // Remember which URL failed to load. When the URL changes, the old failure no longer applies.
    const [failedUrl, setFailedUrl] = useState('');
    const trimmed = url.trim();

    if (!trimmed) return null;

    if (failedUrl === trimmed) {
        return (
            <p className="text-sm text-red-500">
                {locale === 'ar' ? 'تعذر تحميل الصورة من هذا الرابط' : "Couldn't load an image from this URL"}
            </p>
        );
    }

    return (
        <img
            src={trimmed}
            alt={alt}
            onError={() => setFailedUrl(trimmed)}
            className="w-full max-h-64 object-cover rounded-xl border border-gray-100"
        />
    );
}