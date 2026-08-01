import { ReactNode } from 'react';

interface PageHeaderProps {
    emoji?: string;
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export default function PageHeader({ emoji, title, subtitle, action }: PageHeaderProps) {
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
                {action}
            </div>
        </div>
    );
}