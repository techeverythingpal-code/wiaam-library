'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import type { StudentWithBorrows } from './page';

type ViewMode = 'cards' | 'table';

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

export default function StudentsView({ students }: { students: StudentWithBorrows[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>('cards');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    function toggleHistory(studentId: number) {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                next.add(studentId);
            }
            return next;
        });
    }

    return (
        <main className="min-h-screen">
            <PageHeader
                emoji="🎒"
                title="Manage Students"
                subtitle="Keep track of your library's young readers"
                action={
                    <Link href="/admin/students/new">
                        <Button>Add Student</Button>
                    </Link>
                }
            />

            <div className="max-w-4xl mx-auto px-6 py-10">
                <div className="flex gap-2 mb-6">
                    <Button
                        size="sm"
                        variant={viewMode === 'cards' ? 'solid' : 'outline'}
                        onClick={() => setViewMode('cards')}
                    >
                        Cards
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'solid' : 'outline'}
                        onClick={() => setViewMode('table')}
                    >
                        Detailed List
                    </Button>
                </div>

                {students.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">No students yet.</p>
                        </Card.Content>
                    </Card>
                ) : viewMode === 'cards' ? (
                    <div className="flex flex-col gap-3">
                        {students.map((student) => {
                            const activeCount = student.borrows.filter((b) => b.flag).length;
                            return (
                                <Card key={student.student_id} className="border-2 border-gray-100">
                                    <Card.Content className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">
                                                #{student.student_id} — {student.student_name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {student.grade ? `Grade ${student.grade}` : 'No grade'}
                                                {student.phone ? ` · ${student.phone}` : ''}
                                                {activeCount > 0 ? ` · ${activeCount} active borrow${activeCount > 1 ? 's' : ''}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/admin/students/${student.student_id}/edit`}>
                                                <Button variant="outline">Edit</Button>
                                            </Link>
                                        </div>
                                    </Card.Content>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="border-2 border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                                    <th className="px-4 py-3 font-semibold">ID</th>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Grade</th>
                                    <th className="px-4 py-3 font-semibold">Phone</th>
                                    <th className="px-4 py-3 font-semibold">Active Borrows</th>
                                    <th className="px-4 py-3 font-semibold">History</th>
                                    <th className="px-4 py-3 font-semibold"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const activeCount = student.borrows.filter((b) => b.flag).length;
                                    const isExpanded = expandedIds.has(student.student_id);

                                    return (
                                        <>
                                            <tr
                                                key={student.student_id}
                                                className="border-b border-gray-100 last:border-0"
                                            >
                                                <td className="px-4 py-3">{student.student_id}</td>
                                                <td className="px-4 py-3 font-medium">{student.student_name}</td>
                                                <td className="px-4 py-3">{student.grade ?? '—'}</td>
                                                <td className="px-4 py-3">{student.phone ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    {activeCount > 0 ? (
                                                        <Chip size="sm" variant="soft" color="warning">
                                                            {activeCount}
                                                        </Chip>
                                                    ) : (
                                                        <span className="text-gray-400">0</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {student.borrows.length === 0 ? (
                                                        <span className="text-gray-400">No history</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleHistory(student.student_id)}
                                                            className="text-orange-600 hover:underline"
                                                        >
                                                            {isExpanded ? 'Hide' : 'Show'} ({student.borrows.length})
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link href={`/admin/students/${student.student_id}/edit`}>
                                                        <Button size="sm" variant="outline">Edit</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                            {isExpanded && student.borrows.length > 0 && (
                                                <tr key={`${student.student_id}-history`} className="bg-gray-50/50 border-b border-gray-100">
                                                    <td></td>
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex flex-col gap-2">
                                                            {student.borrows.map((borrow) => (
                                                                <div
                                                                    key={borrow.borrow_id}
                                                                    className="flex items-center justify-between text-xs text-gray-600"
                                                                >
                                                                    <span>
                                                                        📖 {borrow.book_name} · borrowed {formatDate(borrow.date_borrow)}
                                                                        {borrow.date_back ? ` · returned ${formatDate(borrow.date_back)}` : ''}
                                                                    </span>
                                                                    <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                                                        {borrow.flag ? 'Active' : 'Returned'}
                                                                    </Chip>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Card>
                )}
            </div>
        </main>
    );
}