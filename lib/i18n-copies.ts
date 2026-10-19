import type { Locale } from '@/lib/i18n';

// The label of a copy: book 5, copy number 2  ->  "5-2"
export function copyLabel(bookId: number, copyNumber: number): string {
    return `${bookId}-${copyNumber}`;
}

const copiesText = {
    en: {
        // Add book form
        copyCount: 'Number of copies (optional)',
        copyCountHint: 'Copies are numbered automatically. Book 5 with 3 copies gets 5-1, 5-2 and 5-3.',
        // Copies section on the edit page
        copiesTitle: 'Copies',
        noCopies: 'No copies yet. This book can still be borrowed without a copy.',
        copy: 'Copy',
        addCopy: 'Add copy',
        addingCopy: 'Adding...',
        deleteCopy: 'Delete',
        confirmDeleteCopy: 'Delete copy {label}?',
        copyBorrowed: 'Borrowed',
        copyAvailable: 'Available',
        copyFailed: 'Something went wrong. Please try again.',
        // Borrow forms
        chooseCopy: 'Copy',
        noCopyChosen: 'Choose a copy',
        // Public pages
        copiesAvailable: '{available} of {total} copies available',
        allCopiesBorrowed: 'All copies are borrowed',
    },
    ar: {
        // Add book form
        copyCount: 'عدد النسخ (اختياري)',
        copyCountHint: 'تُرقَّم النسخ تلقائيًا. الكتاب رقم 5 بثلاث نسخ يحصل على 5-1 و5-2 و5-3.',
        // Copies section on the edit page
        copiesTitle: 'النسخ',
        noCopies: 'لا توجد نسخ بعد. ما زال بإمكان استعارة هذا الكتاب بدون نسخة.',
        copy: 'النسخة',
        addCopy: 'إضافة نسخة',
        addingCopy: 'جارٍ الإضافة...',
        deleteCopy: 'حذف',
        confirmDeleteCopy: 'هل تريد حذف النسخة {label}؟',
        copyBorrowed: 'مستعارة',
        copyAvailable: 'متاحة',
        copyFailed: 'حدث خطأ. حاول مرة أخرى.',
        // Borrow forms
        chooseCopy: 'النسخة',
        noCopyChosen: 'اختر نسخة',
        // Public pages
        copiesAvailable: '{available} من {total} نسخ متاحة',
        allCopiesBorrowed: 'جميع النسخ مستعارة',
    },
} as const;

export type CopiesText = { [K in keyof typeof copiesText.en]: string };

export function getCopiesText(locale: Locale): CopiesText {
    return copiesText[locale];
}
