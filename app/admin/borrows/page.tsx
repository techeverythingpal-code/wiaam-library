import Link from 'next/link';
import { sql } from '@/lib/db';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import ReturnButton from './return-button';

interface Borrow {
    borrow_id: number;
    date_borrow: string;
    date_back: string | null;
    flag: boolean;
    book_name: string;
    student_name: string;
}

async function getBorrows(): Promise<Borrow[]> {
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
  ` as Borrow[];
}

export default async function BorrowsPage() {
    const borrows = await getBorrows();

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔄"
                title="Manage Borrows"
                subtitle="Track which books are out and when they're due back"
                action={
                    <Link href="/admin/borrows/new">
                        <Button>New Borrow</Button>
                    </Link>
                }
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                {borrows.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">
                                No borrows yet.
                            </p>
                        </Card.Content>
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3">
                        {borrows.map((borrow) => (
                            <Card key={borrow.borrow_id} className="border-2 border-gray-100">
                                <Card.Content className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">
                                            #{borrow.borrow_id} — {borrow.book_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {borrow.student_name} · borrowed{' '}
                                            {new Date(borrow.date_borrow).toLocaleDateString()}
                                            {borrow.date_back
                                                ? ` · returned ${new Date(borrow.date_back).toLocaleDateString()}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                            {borrow.flag ? 'Active' : 'Returned'}
                                        </Chip>
                                        {borrow.flag && <ReturnButton borrowId={borrow.borrow_id} />}
                                    </div>
                                </Card.Content>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}