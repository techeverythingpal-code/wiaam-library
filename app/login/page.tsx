'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Label, Button } from '@heroui/react';

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
            <div className="flex flex-col gap-1">
              <Label htmlFor="userName">Username</Label>
              <Input
                id="userName"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
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
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Card.Content>
      </Card>
    </main>
  );
}