import type { Locale } from '@/lib/i18n';

const copiesText = {
    en: {
        // Add book form
        firstCopyId: 'First copy ID (optional)',
        firstCopyHint: 'The number on the sticker of the book. You can add copies later.',
        // Copies section on the edit page
        copiesTitle: 'Copies',
        noCopies: 'No copies yet. This book can still be borrowed without a copy.',
        copyId: 'Copy ID',
        addCopy: 'Add copy',
        addingCopy: 'Adding...',
        deleteCopy: 'Delete',
        confirmDeleteCopy: 'Delete copy {id}?',
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
        firstCopyId: 'رقم النسخة الأولى (اختياري)',
        firstCopyHint: 'الرقم الموجود على ملصق الكتاب. يمكنك إضافة نسخ لاحقًا.',
        // Copies section on the edit page
        copiesTitle: 'النسخ',
        noCopies: 'لا توجد نسخ بعد. ما زال بإمكان استعارة هذا الكتاب بدون نسخة.',
        copyId: 'رقم النسخة',
        addCopy: 'إضافة نسخة',
        addingCopy: 'جارٍ الإضافة...',
        deleteCopy: 'حذف',
        confirmDeleteCopy: 'هل تريد حذف النسخة {id}؟',
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