'use client';

import { useState, Fragment } from 'react';
import Link from 'next/link';
import { Card, Button, Chip } from '@heroui/react';
import PageHeader from '@/components/PageHeader';
import ImportExcel from '@/components/ImportExcel';
import type { StudentWithBorrows } from './page';
import type { Locale } from '@/lib/i18n';
import { formatDate } from '@/lib/format';

interface StudentsText {
    title: string;
    subtitle: string;
    backToHome: string;
    addStudent: string;
    cardsView: string;
    detailedList: string;
    noStudents: string;
    grade: string;
    noGrade: string;
    activeBorrow: string;
    activeBorrows: string;
    edit: string;
    id: string;
    name: string;
    phone: string;
    activeBorrowsCol: string;
    history: string;
    noHistory: string;
    hide: string;
    show: string;
    borrowed: string;
    returnedOn: string;
    active: string;
    returned: string;
}

export default function StudentsView({
    students,
    locale,
    text,
}: {
    students: StudentWithBorrows[];
    locale: Locale;
    text: StudentsText;
}) {
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
                title={text.title}
                subtitle={text.subtitle}
                locale={locale}
                action={
                    <div className="flex items-center gap-3">
                        <Link href="/admin">
                            <Button variant="outline">{text.backToHome}</Button>
                        </Link>
                        <ImportExcel kind="students" locale={locale} />
                        <Link href="/admin/students/new">
                            <Button>{text.addStudent}</Button>
                        </Link>
                        
                    </div>
                }
            />

            <div className="max-w-5xl mx-auto px-6 py-10">
                {students.length === 0 ? (
                    <Card className="border-2 border-gray-100">
                        <Card.Content>
                            <p className="text-gray-500 py-6 text-center">{text.noStudents}</p>
                        </Card.Content>
                    </Card>
                ) : (
                    <Card className="border-2 border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50 text-start">
                                    <th className="px-4 py-3 font-semibold text-start">{text.id}</th>
                                    <th className="px-4 py-3 font-semibold text-start">{text.name}</th>
                                    <th className="px-4 py-3 font-semibold text-start">{text.grade}</th>
                                    <th className="px-4 py-3 font-semibold text-start">{text.phone}</th>
                                    <th className="px-4 py-3 font-semibold text-start">{text.activeBorrowsCol}</th>
                                    <th className="px-4 py-3 font-semibold text-start">{text.history}</th>
                                    <th className="px-4 py-3 font-semibold text-start"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const activeCount = student.borrows.filter((b) => b.flag).length;
                                    const isExpanded = expandedIds.has(student.student_id);

                                    return (
                                        <Fragment key={student.student_id}>
                                            <tr className="border-b border-gray-100 last:border-0">
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
                                                        <span className="text-gray-400">{text.noHistory}</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleHistory(student.student_id)}
                                                            className="text-orange-600 hover:underline"
                                                        >
                                                            {isExpanded ? text.hide : text.show} ({student.borrows.length})
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link href={`/admin/students/${student.student_id}/edit`}>
                                                        <Button size="sm" variant="outline">{text.edit}</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                            {isExpanded && student.borrows.length > 0 && (
                                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                                    <td></td>
                                                    <td colSpan={6} className="px-4 py-3">
                                                        <div className="flex flex-col gap-2">
                                                            {student.borrows.map((borrow) => (
                                                                <div
                                                                    key={borrow.borrow_id}
                                                                    className="flex items-center justify-between text-xs text-gray-600"
                                                                >
                                                                    <span>
                                                                        📖 {borrow.book_name} · {text.borrowed} {formatDate(borrow.date_borrow, locale)}
                                                                        {borrow.date_back ? ` · ${text.returnedOn} ${formatDate(borrow.date_back, locale)}` : ''}
                                                                    </span>
                                                                    <Chip size="sm" variant="soft" color={borrow.flag ? 'warning' : 'success'}>
                                                                        {borrow.flag ? text.active : text.returned}
                                                                    </Chip>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
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