import Link from 'next/link';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';

async function getUser(userId: string) {
    const rows = await sql`
    SELECT user_id, user_name, role
    FROM library_users
    WHERE user_id = ${userId}
  `;
    return rows[0] as { user_id: number; user_name: string; role: string } | undefined;
}

async function getStats() {
    const [books, students, activeBorrows] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM book`,
        sql`SELECT COUNT(*)::int AS count FROM student`,
        sql`SELECT COUNT(*)::int AS count FROM borrow WHERE flag = true`,
    ]);

    return {
        bookCount: books[0].count as number,
        studentCount: students[0].count as number,
        activeBorrowCount: activeBorrows[0].count as number,
    };
}

interface RecentBorrow {
    borrow_id: number;
    date_borrow: string;
    date_back: string | null;
    flag: boolean;
    book_name: string;
    student_name: string;
}

async function getRecentBorrows(): Promise<RecentBorrow[]> {
    return await sql`
    SELECT
      b.borrow_id,
      b.date_borrow,
      b.date_back,
      b.flag,
      bk.book_name,
      s.student_name
    FROM borrow b
    JOIN book bk ON bk.book_id = b.book_id
    JOIN student s ON s.student_id = b.student_id
    ORDER BY b.date_borrow DESC
    LIMIT 5
  ` as RecentBorrow[];
}

export default async function AdminPage() {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('session_user')?.value;

    const [user, stats, recentBorrows] = await Promise.all([
        sessionUserId ? getUser(sessionUserId) : Promise.resolve(undefined),
        getStats(),
        getRecentBorrows(),
    ]);

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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <Link href="/admin/books">
                    <Card>
                        <Card.Header>
                            <Card.Title>Books</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <p className="text-3xl font-semibold mb-1">{stats.bookCount}</p>
                            <p className="text-sm text-gray-500">Manage the book catalog</p>
                        </Card.Content>
                    </Card>
                </Link>

                <Link href="/admin/students">
                    <Card>
                        <Card.Header>
                            <Card.Title>Students</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <p className="text-3xl font-semibold mb-1">{stats.studentCount}</p>
                            <p className="text-sm text-gray-500">Manage student records</p>
                        </Card.Content>
                    </Card>
                </Link>

                <Link href="/admin/borrows">
                    <Card>
                        <Card.Header>
                            <Card.Title>Active Borrows</Card.Title>
                        </Card.Header>
                        <Card.Content>
                            <p className="text-3xl font-semibold mb-1">{stats.activeBorrowCount}</p>
                            <p className="text-sm text-gray-500">Track borrowed books</p>
                        </Card.Content>
                    </Card>
                </Link>
            </div>

            <Card>
                <Card.Header>
                    <Card.Title>Recent Activity</Card.Title>
                </Card.Header>
                <Card.Content>
                    {recentBorrows.length === 0 ? (
                        <p className="text-sm text-gray-500">No borrow activity yet.</p>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {recentBorrows.map((borrow) => (
                                <div
                                    key={borrow.borrow_id}
                                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                                >
                                    <div>
                                        <p className="font-medium">{borrow.book_name}</p>
                                        <p className="text-sm text-gray-500">
                                            borrowed by {borrow.student_name} · {new Date(borrow.date_borrow).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Chip size="sm" variant="soft">
                                        {borrow.flag ? 'Active' : 'Returned'}
                                    </Chip>
                                </div>
                            ))}
                        </div>
                    )}
                </Card.Content>
            </Card>
        </main>
    );
}