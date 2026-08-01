import { Card } from '@heroui/react';
import PageHeader from '@/components/PageHeader';

export default function BorrowsPage() {
    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🔄"
                title="Manage Borrows"
                subtitle="Track which books are out and when they're due back"
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                <Card className="border-2 border-gray-100">
                    <Card.Content>
                        <p className="text-gray-500 py-6 text-center">
                            Borrow tracking is coming soon.
                        </p>
                    </Card.Content>
                </Card>
            </div>
        </main>
    );
}