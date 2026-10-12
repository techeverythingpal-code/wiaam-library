import type { Locale } from '@/lib/i18n';

const TIME_ZONE = 'Asia/Hebron';

// Western digits (nu-latn) in both languages, as you chose.
const LOCALE_TAGS: Record<Locale, string> = {
    en: 'en-GB',
    ar: 'ar-PS-u-nu-latn',
};

export function formatDate(date: string | Date, locale: Locale): string {
    return new Date(date).toLocaleDateString(LOCALE_TAGS[locale], {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}