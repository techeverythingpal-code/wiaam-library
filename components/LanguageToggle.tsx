'use client';

import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE, type Locale } from '@/lib/i18n';

export default function LanguageToggle({ locale }: { locale: Locale }) {
    const router = useRouter();

    function switchLocale() {
        const next: Locale = locale === 'en' ? 'ar' : 'en';
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000`;
        router.refresh();
    }

    return (
        <button
            onClick={switchLocale}
            className="text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50"
        >
            {locale === 'en' ? 'العربية' : 'English'}
        </button>
    );
}