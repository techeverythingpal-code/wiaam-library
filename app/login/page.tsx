'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button } from '@heroui/react';

export default function LoginPage() {
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
      setError(data.error ?? 'Login failed');
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-20">
      <Card>
        <Card.Header>
          <Card.Title>Librarian Login</Card.Title>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Username"
              value={userName}
              onValueChange={setUserName}
              isRequired
            />
            <Input
              type="password"
              label="Password"
              value={password}
              onValueChange={setPassword}
              isRequired
            />
            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}
            <Button type="submit" isDisabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </main>
  );
}