import type { Locale } from '@/lib/i18n';

const requestText = {
    en: {
        // Book details popup
        available: 'Available',
        currentlyBorrowed: 'Currently borrowed',
        author: 'Author',
        ageGroup: 'Age group',
        availability: 'Availability',
        viewDetails: 'View details',
        requestBorrow: 'Request to borrow',
        close: 'Close',
        // Request form
        formTitle: 'Your details',
        yourName: 'Your name',
        phone: 'Phone number',
        note: 'Note (optional)',
        sendRequest: 'Send request',
        sending: 'Sending...',
        cancel: 'Cancel',
        success: 'Your request was sent. The librarian will contact you.',
        errorInvalid: 'Please enter a valid name and phone number.',
        errorDuplicate: 'You already requested this book.',
        errorGeneric: 'Something went wrong. Please try again.',
        // Admin page
        adminTitle: 'Borrow requests',
        adminSubtitle: 'Requests sent by visitors',
        adminBackToHome: 'Back to home',
        adminNoRequests: 'No borrow requests yet.',
        adminRequestedOn: 'Requested',
        adminPending: 'Pending',
        adminDone: 'Done',
        adminMarkDone: 'Mark as done',
        adminDelete: 'Delete',
        adminFailed: 'Something went wrong. Please try again.',
        adminSaving: 'Saving...',
        adminConfirmDelete: 'Delete this request?',
        adminPendingBadge: 'pending',
        adminCardDesc: 'Review requests from visitors',
    },
    ar: {
        // Book details popup
        available: 'متوفر',
        currentlyBorrowed: 'مستعار حاليًا',
        author: 'المؤلف',
        ageGroup: 'الفئة العمرية',
        availability: 'متوفر للإعارة',
        viewDetails: 'عرض التفاصيل',
        requestBorrow: 'طلب استعارة',
        close: 'إغلاق',
        // Request form
        formTitle: 'بياناتك',
        yourName: 'اسمك',
        phone: 'رقم الهاتف',
        note: 'ملاحظة (اختياري)',
        sendRequest: 'إرسال الطلب',
        sending: 'جارٍ الإرسال...',
        cancel: 'إلغاء',
        success: 'تم إرسال طلبك. سيتواصل معك أمين المكتبة.',
        errorInvalid: 'يرجى إدخال اسم ورقم هاتف صحيحين.',
        errorDuplicate: 'لقد طلبت هذا الكتاب مسبقًا.',
        errorGeneric: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        // Admin page
        adminTitle: 'طلبات الاستعارة',
        adminSubtitle: 'الطلبات المرسلة من الزوار',
        adminBackToHome: 'العودة للرئيسية',
        adminNoRequests: 'لا توجد طلبات استعارة بعد.',
        adminRequestedOn: 'تاريخ الطلب',
        adminPending: 'قيد الانتظار',
        adminDone: 'تم',
        adminMarkDone: 'تحديد كمنجز',
        adminDelete: 'حذف',
        adminFailed: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
        adminSaving: 'جارٍ الحفظ...',
        adminConfirmDelete: 'هل تريد حذف هذا الطلب؟',
        adminPendingBadge: 'قيد الانتظار',
        adminCardDesc: 'مراجعة طلبات الزوار',
    },
} as const;

export type RequestText = { [K in keyof typeof requestText.en]: string };

export function getRequestText(locale: Locale): RequestText {
    return requestText[locale];
}