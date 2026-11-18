import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { getLocale } from '@/lib/i18n-server';

// Shared helpers for the admin API routes (app/api/...).
//  - isAdmin():      is the librarian logged in?
//  - apiError():     send an error message in the visitor's language (Arabic or English)
//  - serverError():  log the real problem, but show only a friendly message
//  - parseId():      read an ID from the URL or the form safely

// Every error message the admin API can send, in both languages.
// {name} parts are filled in by apiError(), for example {id} -> 12.
const messages = {
    en: {
        notAuthenticated: 'Please log in again.',
        invalidRequest: 'Something in the form is not valid. Please check it and try again.',
        server: 'Something went wrong. Please try again.',
        // Login
        loginRequired: 'Username and password are required.',
        loginInvalid: 'Invalid username or password.',
        // Books
        bookFieldsRequired: 'Book ID, title and author are required.',
        bookTitleAuthorRequired: 'Title and author are required.',
        bookIdInvalid: 'Book ID must be a positive whole number.',
        bookIdExists: 'Book ID {id} already exists.',
        bookNotFound: 'This book was not found.',
        bookBorrowedNow: 'This book is borrowed right now, so it cannot be deleted.',
        bookHasHistory: 'This book has borrow history, so it cannot be deleted.',
        copyCountRange: 'Number of copies must be between 0 and {max}.',
        // Copies
        addCopiesRange: 'Number of copies must be between 1 and {max}.',
        copyNotFound: 'This copy was not found.',
        copyBorrowedNow: 'This copy is borrowed right now, so it cannot be deleted.',
        copyHasHistory: 'This copy has borrow history, so it cannot be deleted.',
        // Students
        studentFieldsRequired: 'Student ID and name are required.',
        studentNameRequired: 'Student name is required.',
        studentIdInvalid: 'Student ID must be a positive whole number.',
        studentIdExists: 'Student ID {id} already exists.',
        studentNotFound: 'This student was not found.',
        studentBorrowedNow: 'This student has a book borrowed right now, so they cannot be deleted.',
        studentHasHistory: 'This student has borrow history, so they cannot be deleted.',
        // Borrows
        borrowFieldsRequired: 'Borrow ID, book and student are required.',
        borrowIdInvalid: 'Borrow ID must be a positive whole number.',
        borrowIdExists: 'Borrow ID {id} already exists.',
        copyRequired: 'This book has copies. Choose which copy is borrowed.',
        wrongCopy: 'This copy does not belong to this book.',
        noCopies: 'This book has no copies.',
        copyTaken: 'This copy is already checked out.',
        bookTaken: 'This book is already checked out.',
        borrowNotActive: 'This borrow was not found or is already returned.',
        // Borrow requests
        requestNotFound: 'This request was not found.',
        requestNotPending: 'This request was already handled.',
    },
    ar: {
        notAuthenticated: 'يرجى تسجيل الدخول مرة أخرى.',
        invalidRequest: 'بعض البيانات في النموذج غير صحيحة. تحقق منها وحاول مرة أخرى.',
        server: 'حدث خطأ. حاول مرة أخرى.',
        // Login
        loginRequired: 'اسم المستخدم وكلمة المرور مطلوبان.',
        loginInvalid: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
        // Books
        bookFieldsRequired: 'رقم الكتاب والعنوان والمؤلف مطلوبة.',
        bookTitleAuthorRequired: 'العنوان والمؤلف مطلوبان.',
        bookIdInvalid: 'رقم الكتاب يجب أن يكون عددًا صحيحًا موجبًا.',
        bookIdExists: 'رقم الكتاب {id} موجود مسبقًا.',
        bookNotFound: 'لم يتم العثور على هذا الكتاب.',
        bookBorrowedNow: 'هذا الكتاب مستعار الآن، لذلك لا يمكن حذفه.',
        bookHasHistory: 'لهذا الكتاب سجل استعارات، لذلك لا يمكن حذفه.',
        copyCountRange: 'عدد النسخ يجب أن يكون بين 0 و{max}.',
        // Copies
        addCopiesRange: 'عدد النسخ يجب أن يكون بين 1 و{max}.',
        copyNotFound: 'لم يتم العثور على هذه النسخة.',
        copyBorrowedNow: 'هذه النسخة مستعارة الآن، لذلك لا يمكن حذفها.',
        copyHasHistory: 'لهذه النسخة سجل استعارات، لذلك لا يمكن حذفها.',
        // Students
        studentFieldsRequired: 'رقم الطالب والاسم مطلوبان.',
        studentNameRequired: 'اسم الطالب مطلوب.',
        studentIdInvalid: 'رقم الطالب يجب أن يكون عددًا صحيحًا موجبًا.',
        studentIdExists: 'رقم الطالب {id} موجود مسبقًا.',
        studentNotFound: 'لم يتم العثور على هذا الطالب.',
        studentBorrowedNow: 'لدى هذا الطالب كتاب مستعار الآن، لذلك لا يمكن حذفه.',
        studentHasHistory: 'لهذا الطالب سجل استعارات، لذلك لا يمكن حذفه.',
        // Borrows
        borrowFieldsRequired: 'رقم الاستعارة والكتاب والطالب مطلوبة.',
        borrowIdInvalid: 'رقم الاستعارة يجب أن يكون عددًا صحيحًا موجبًا.',
        borrowIdExists: 'رقم الاستعارة {id} موجود مسبقًا.',
        copyRequired: 'لهذا الكتاب نسخ. اختر النسخة المستعارة.',
        wrongCopy: 'هذه النسخة لا تتبع هذا الكتاب.',
        noCopies: 'لا توجد نسخ لهذا الكتاب.',
        copyTaken: 'هذه النسخة مستعارة بالفعل.',
        bookTaken: 'هذا الكتاب مستعار بالفعل.',
        borrowNotActive: 'لم يتم العثور على هذه الاستعارة أو أنها أُعيدت مسبقًا.',
        // Borrow requests
        requestNotFound: 'لم يتم العثور على هذا الطلب.',
        requestNotPending: 'تمت معالجة هذا الطلب مسبقًا.',
    },
} as const;

export type ApiErrorCode = keyof typeof messages.en;

const MAX_ID = 2147483647; // Postgres int4

// Is the librarian logged in? (checks the signed session cookie)
export async function isAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    return Boolean(await verifySession(cookieStore.get(SESSION_COOKIE)?.value));
}

// Sends { error, code } with the message in the visitor's language.
// The forms already show data.error, so they need no changes.
export async function apiError(
    code: ApiErrorCode,
    status: number,
    vars: Record<string, string | number> = {}
) {
    const locale = await getLocale();
    let text: string = messages[locale][code];
    for (const [key, value] of Object.entries(vars)) {
        text = text.replace(`{${key}}`, String(value));
    }
    return NextResponse.json({ error: text, code }, { status });
}

// For unexpected problems: the real error goes to the server log (Vercel logs),
// the visitor only sees "Something went wrong".
export async function serverError(what: string, err: unknown) {
    console.error(`${what}:`, err);
    return apiError('server', 500);
}

// A positive whole number that fits the database, or null.
// Works for "12" from the URL and 12 from a form.
export function parseId(value: unknown): number | null {
    const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
    if (!/^\d+$/.test(text)) return null;
    const n = Number(text);
    return n >= 1 && n <= MAX_ID ? n : null;
}

// Reads the JSON body. A broken body becomes {} instead of crashing the route.
export async function readJson(request: Request): Promise<Record<string, unknown>> {
    try {
        const body = await request.json();
        return body && typeof body === 'object' ? body : {};
    } catch {
        return {};
    }
}