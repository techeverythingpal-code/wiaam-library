import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';

export default async function Loading() {
    const locale = await getLocale();
    const { loading, loadingLetters } = t(locale);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="letter-loader">
                {loadingLetters.map((letter) => (
                    <span key={letter}>{letter}</span>
                ))}
            </div>
            <p className="text-gray-500 text-lg">{loading}</p>
        </div>
    );
}