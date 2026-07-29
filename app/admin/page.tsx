import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { Card, Button } from '@heroui/react';

async function getUser(userId: string) {
    const rows = await sql`
    SELECT user_id, user_name, role
    FROM library_users
    WHERE user_id = ${userId}
  `;
    return rows[0] as { user_id: number; user_name: string; role: string } | undefined;
}

export default async function AdminPage() {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('session_user')?.value;

    const user = sessionUserId ? await getUser(sessionUserId) : undefined;

    return (
        <main className="max-w-5xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold">
                    Welcome, {user?.user_name ?? 'Librarian'}
                </h1>
                <form action="/api/logout" method="POST">
                    <Button type="submit" variant="outline">Log Out</Button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                    <Card.Header>
                        <Card.Title>Books</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p className="text-sm text-gray-500">Manage the book catalog yes</p>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Students</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p className="text-sm text-gray-500">Manage student records</p>
                    </Card.Content>
                </Card>

                <Card>
                    <Card.Header>
                        <Card.Title>Borrows</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p className="text-sm text-gray-500">Track borrowed books</p>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}