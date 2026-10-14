import Link from 'next/link';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { formatDate } from '@/lib/format';
import { getRequestText } from '@/lib/i18n-requests';

async function getUser(userId: string) {
    const rows = await sql`
    SELECT user_id, user_name, role
    FROM library_users
    WHERE user_id = ${userId}
  `;
    return rows[0] as { user_id: number; user_name: string; role: string } | undefined;
}

async function getStats() {
    const [books, students, activeBorrows, pendingRequests] = await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM book`,
        sql`SELECT COUNT(*)::int AS count FROM student`,
        sql`SELECT COUNT(*)::int AS count FROM borrow WHERE flag = true`,
        sql`SELECT COUNT(*)::int AS count FROM borrow_request WHERE status = 'pending'`,
    ]);

    return {
        bookCount: books[0].count as number,
        studentCount: students[0].count as number,
        activeBorrowCount: activeBorrows[0].count as number,
        pendingRequestCount: pendingRequests[0].count as number,
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
    const sessionUserId = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

    const [user, stats, recentBorrows, locale] = await Promise.all([
        sessionUserId ? getUser(sessionUserId) : Promise.resolve(undefined),
        getStats(),
        getRecentBorrows(),
        getLocale(),
    ]);

    const { admin, common } = t(locale);
    const requestText = getRequestText(locale);
    const REQUESTS_HREF = '/admin/borrow-requests';
    const hasPendingRequests = stats.pendingRequestCount > 0;
    const statValues = [
        stats.bookCount,
        stats.studentCount,
        stats.activeBorrowCount,
        stats.pendingRequestCount,
    ];

    const statCards = [
        {
            href: '/admin/books',
            label: admin.books,
            icon: '📚',
            cardBg: 'bg-gradient-to-br from-orange-50 to-orange-100/60 border-orange-200/60',
            iconBg: 'bg-orange-200/70',
            numberColor: 'text-orange-600',
            description: admin.booksDesc,
        },
        {
            href: '/admin/students',
            label: admin.students,
            icon: '🎒',
            cardBg: 'bg-gradient-to-br from-teal-50 to-teal-100/60 border-teal-200/60',
            iconBg: 'bg-teal-200/70',
            numberColor: 'text-teal-600',
            description: admin.studentsDesc,
        },
        {
            href: '/admin/borrows',
            label: admin.activeBorrows,
            icon: '🔄',
            cardBg: 'bg-gradient-to-br from-pink-50 to-pink-100/60 border-pink-200/60',
            iconBg: 'bg-pink-200/70',
            numberColor: 'text-pink-600',
            description: admin.activeBorrowsDesc,
        },
        {
            href: REQUESTS_HREF,
            label: requestText.adminTitle,
            icon: '🔔',
            cardBg: 'bg-gradient-to-br from-violet-50 to-violet-100/60 border-violet-200/60',
            iconBg: 'bg-violet-300',
            numberColor: 'text-violet-600',
            description: requestText.adminCardDesc,
        },
    ] as const;

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="👋"
                title={`${admin.welcome}, ${user?.user_name ?? admin.librarian}`}
                subtitle={admin.subtitle}
                locale={locale}
                action={
                    <form action="/api/logout" method="POST">
                        <Button type="submit" variant="outline" className="bg-white/70">
                            {admin.logOut}
                        </Button>
                    </form>
                }
            />

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {statCards.map((stat, i) => (
                        <Link key={stat.href} href={stat.href}>
                            <Card
                                className={`${stat.cardBg} border-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full ${
                                    stat.href === REQUESTS_HREF && hasPendingRequests
                                        ? 'ring-2 ring-red-500 shadow-lg shadow-red-200'
                                        : ''
                                }`}
                            >
                                <Card.Content className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`${stat.iconBg} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm`}>
                                            {stat.icon}
                                        </div>
                                        {stat.href === REQUESTS_HREF && hasPendingRequests && (
                                            <span className="flex shrink-0 items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-red-500/40">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                                                </span>
                                                {stats.pendingRequestCount} {requestText.adminPendingBadge}
                                            </span>
                                        )}
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
                        <Card.Title className="text-xl">✨ {admin.recentActivity}</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        {recentBorrows.length === 0 ? (
                            <p className="text-gray-500 py-6 text-center">
                                {admin.noActivity}
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
                                                    {admin.borrowedBy} {borrow.student_name} · {formatDate(borrow.date_borrow, locale)}
                                                </p>
                                            </div>
                                        </div>
                                        <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                            {borrow.flag ? common.active : common.returned}
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