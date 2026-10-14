'use client';

import { useState } from 'react';
import { Card, Chip, Button, Input, Label, TextArea, Modal, useOverlayState } from '@heroui/react';
import type { RequestText } from '@/lib/i18n-requests';

export interface BookCardBook {
    book_id: number;
    book_name: string;
    auther: string;
    age_group: string | null;
    book_cover: string | null;
}

interface BookCardProps {
    book: BookCardBook;
    isAvailable: boolean;
    byLabel: string;
    text: RequestText;
}

export default function BookCard({ book, isAvailable, byLabel, text }: BookCardProps) {
    const state = useOverlayState();

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                aria-label={`${text.viewDetails}: ${book.book_name}`}
                onClick={() => state.open()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        state.open();
                    }
                }}
                className="cursor-pointer rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
                <Card className="h-full border-2 border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    {book.book_cover && (
                        <img
                            src={book.book_cover}
                            alt={book.book_name}
                            className="w-full h-48 object-cover"
                        />
                    )}
                    <Card.Header>
                        <Card.Title>{book.book_name}</Card.Title>
                        <Card.Description>{byLabel} {book.auther}</Card.Description>
                    </Card.Header>
                    <Card.Content>
                        {book.age_group && (
                            <Chip size="sm" variant="soft">{book.age_group}</Chip>
                        )}
                    </Card.Content>
                </Card>
            </div>

            <Modal state={state}>
                <Modal.Backdrop isDismissable>
                    <Modal.Container size="md" scroll="inside">
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <BookDetails
                                book={book}
                                isAvailable={isAvailable}
                                text={text}
                                onClose={() => state.close()}
                            />
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>
        </>
    );
}

function BookDetails({
    book,
    isAvailable,
    text,
    onClose,
}: {
    book: BookCardBook;
    isAvailable: boolean;
    text: RequestText;
    onClose: () => void;
}) {
    const [showForm, setShowForm] = useState(false);
    const [requesterName, setRequesterName] = useState('');
    const [studentId, setStudentId] = useState('');
    const [phone, setPhone] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/borrow-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId: book.book_id,
                    studentId,
                    requesterName,
                    phone,
                    note,
                }),
            });

            if (res.ok) {
                setSent(true);
            } else {
                const data = await res.json().catch(() => ({}));
                if (data.code === 'invalid') setError(text.errorInvalid);
                else if (data.code === 'duplicate') setError(text.errorDuplicate);
                else setError(text.errorGeneric);
            }
        } catch {
            setError(text.errorGeneric);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Modal.Header>
                <Modal.Heading>{book.book_name}</Modal.Heading>
            </Modal.Header>

            <Modal.Body>
                {book.book_cover && (
                    <img
                        src={book.book_cover}
                        alt={book.book_name}
                        className="w-full max-h-64 object-cover rounded-xl mb-4"
                    />
                )}

                <dl className="flex flex-col gap-3 text-sm">
                    <div>
                        <dt className="text-gray-400">{text.author}</dt>
                        <dd className="font-medium">{book.auther}</dd>
                    </div>
                    {book.age_group && (
                        <div>
                            <dt className="text-gray-400">{text.ageGroup}</dt>
                            <dd>
                                <Chip size="sm" variant="soft">{book.age_group}</Chip>
                            </dd>
                        </div>
                    )}
                    <div>
                        <dt className="text-gray-400">{text.availability}</dt>
                        <dd>
                            <Chip
                                size="sm"
                                variant="soft"
                                color={isAvailable ? 'success' : 'warning'}
                            >
                                {isAvailable ? text.available : text.currentlyBorrowed}
                            </Chip>
                        </dd>
                    </div>
                </dl>

                {sent && (
                    <p className="mt-5 rounded-xl bg-green-50 text-green-700 text-sm p-3">
                        {text.success}
                    </p>
                )}

                {showForm && !sent && (
                    <form
                        id="borrow-request-form"
                        onSubmit={handleSubmit}
                        className="mt-5 flex flex-col gap-4"
                    >
                        <p className="font-semibold">{text.formTitle}</p>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="requesterName">{text.yourName}</Label>
                            <Input
                                id="requesterName"
                                value={requesterName}
                                onChange={(e) => setRequesterName(e.target.value)}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="requesterStudentId">{text.studentIdLabel}</Label>
                            <Input
                                id="requesterStudentId"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                required
                            />
                        </div>



                        <div className="flex flex-col gap-1">
                            <Label htmlFor="requesterPhone">{text.phone}</Label>
                            <Input
                                id="requesterPhone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                maxLength={20}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <Label htmlFor="requesterNote">{text.note}</Label>
                            <TextArea
                                id="requesterNote"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                maxLength={500}
                                rows={3}
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </form>
                )}
            </Modal.Body>

            <Modal.Footer>
                {sent ? (
                    <Button onPress={onClose}>{text.close}</Button>
                ) : showForm ? (
                    <>
                        <Button variant="outline" onPress={() => setShowForm(false)}>
                            {text.cancel}
                        </Button>
                        <Button type="submit" form="borrow-request-form" isDisabled={loading}>
                            {loading ? text.sending : text.sendRequest}
                        </Button>
                    </>
                ) : (
                    <>
                        <Button variant="outline" onPress={onClose}>
                            {text.close}
                        </Button>
                        <Button onPress={() => setShowForm(true)}>{text.requestBorrow}</Button>
                    </>
                )}
            </Modal.Footer>
        </>
    );
}