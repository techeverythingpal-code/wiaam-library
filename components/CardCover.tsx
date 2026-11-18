'use client';

import { useState } from 'react';

// Card image: shows the cover if there is a link that loads,
// otherwise shows a book icon in the same space (so all cards line up).
export default function CardCover({ url, alt }: { url: string | null; alt: string }) {
    const [failedUrl, setFailedUrl] = useState('');
    const trimmed = (url ?? '').trim();

    if (trimmed && failedUrl !== trimmed) {
        return (
            <img
                src={trimmed}
                alt={alt}
                onError={() => setFailedUrl(trimmed)}
                className="w-full h-48 object-cover"
            />
        );
    }

    return (
        <div
            className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
            aria-hidden="true"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-20 h-20 text-orange-300"
            >
                <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
                <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
            </svg>
        </div>
    );
}