import { cookies } from 'next/headers';

export type Locale = 'en' | 'ar';

export const LOCALE_COOKIE = 'locale';

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE)?.value;
    return value === 'ar' ? 'ar' : 'en';
}

export const dict = {
    en: {
        loading: 'Loading books...',
        loadingLetters: ['A', 'B', 'C'],
    },
    ar: {
        loading: 'جاري تحميل الكتب...',
        loadingLetters: ['أ', 'ب', 'ت'],
    },
} as const;

export function t(locale: Locale) {
    return dict[locale];
}