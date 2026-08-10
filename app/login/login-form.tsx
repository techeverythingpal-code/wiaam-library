'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Input, Label, Button } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { Locale } from '@/lib/i18n';

interface LoginText {
    title: string;
    subtitle: string;
    username: string;
    password: string;
    loggingIn: string;
    logIn: string;
    loginFailed: string;
    backToHome: string;
}

export default function LoginForm({ locale, text }: { locale: Locale; text: LoginText }) {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, password }),
        });

        setLoading(false);

        if (res.ok) {
            router.push('/admin');
            router.refresh();
        } else {
            const data = await res.json();
            setError(data.error ?? text.loginFailed);
        }
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔑"
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
                action={
                    <Link href="/">
                        <Button variant="outline">{text.backToHome}</Button>
                    </Link>
                }
            />

            <div className="max-w-sm mx-auto px-6 py-16">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="userName">{text.username}</Label>
                                <Input
                                    id="userName"
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <Label htmlFor="password">{text.password}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                            <Button type="submit" isDisabled={loading}>
                                {loading ? text.loggingIn : text.logIn}
                            </Button>
                        </form>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}