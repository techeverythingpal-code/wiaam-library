import { ReactNode } from 'react';
import LanguageToggle from './LanguageToggle';
import type { Locale } from '@/lib/i18n';

interface PageHeaderProps {
    emoji?: string;
    title: string;
    subtitle?: string;
    action?: ReactNode;

    locale: Locale;
}

export default function PageHeader({ emoji, title, subtitle, action, locale }: PageHeaderProps) {
    return (
        <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 border-b border-orange-200/50">
            <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        {emoji ? `${emoji} ` : ''}{title}
                    </h1>
                    {subtitle && (
                        <p className="text-gray-600 mt-2 text-lg">{subtitle}</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {action}

                    <LanguageToggle locale={locale} />
                </div>
            </div>
        </div>
    );
}