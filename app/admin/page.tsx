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

const statCards = [
    {
        href: '/admin/books',
        label: 'Books',
        icon: '📚',
        cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100/60 border-orange-200/60',
        iconBg: 'bg-orange-200/70',
        numberColor: 'text-orange-600',
        description: 'Manage the book catalog',
    },
    {
        href: '/admin/students',
        label: 'Students',
        icon: '🎒',
        cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100/60 border-teal-200/60',
        iconBg: 'bg-teal-200/70',
        numberColor: 'text-teal-600',
        description: 'Manage student records',
    },
    {
        href: '/admin/borrows',
        label: 'Active Borrows',
        icon: '🔄',
        cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100/60 border-pink-200/60',
        iconBg: 'bg-pink-200/70',
        numberColor: 'text-pink-600',
        description: 'Track borrowed books',
    },
] as const;

export default async function AdminPage() {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('session_user')?.value;

    const [user, stats, recentBorrows] = await Promise.all([
        sessionUserId ? getUser(sessionUserId) : Promise.resolve(undefined),
        getStats(),
        getRecentBorrows(),
    ]);

    const statValues = [stats.bookCount, stats.studentCount, stats.activeBorrowCount];

    return (
        <main className="min-h-screen">
            {/* Colored header banner */}
            <div className="bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 border-b border-orange-200/50">
                <div className="max-w-5xl mx-auto px-6 py-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">
                            👋 Welcome, {user?.user_name ?? 'Librarian'}
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">
                            Here&apos;s what&apos;s happening in your library today
                        </p>
                    </div>
                    <form action="/api/logout" method="POST">
                        <Button type="submit" variant="outline" className="bg-white/70">
                            Log Out
                        </Button>
                    </form>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                    {statCards.map((stat, i) => (
                        <Link key={stat.href} href={stat.href}>
                            <Card
                                className={`${stat.cardBg} border-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full`}
                            >
                                <Card.Content className="p-6">
                                    <div className={`${stat.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm`}>
                                        {stat.icon}
                                    </div>
                                    <p className={`text-5xl font-extrabold ${stat.numberColor} mb-1`}>
                                        {statValues[i]}
                                    </p>
                                    <p className="text-lg font-semibold">{stat.label}</p>
                                    <p className="text-sm text-gray-600 mt-1">{stat.description}</p>
                                </Card.Content>
                            </Card>
                        </Link>
                    ))}
                </div>

                <Card className="border-2 border-gray-100">
                    <Card.Header className="pb-2">
                        <Card.Title className="text-xl">✨ Recent Activity</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        {recentBorrows.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center">
                                No borrow activity yet — it&apos;ll show up here once students start borrowing books.
                            </p>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {recentBorrows.map((borrow) => (
                                    <div
                                        key={borrow.borrow_id}
                                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">📖</span>
                                            <div>
                                                <p className="font-medium">{borrow.book_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    borrowed by {borrow.student_name} · {new Date(borrow.date_borrow).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                            {borrow.flag ? 'Active' : 'Returned'}
                                        </Chip>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}