import { cookies } from 'next/headers';

export type Locale = 'en' | 'ar';

export const LOCALE_COOKIE = 'locale';

export async function getLocale(): Promise<Locale> {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE)?.value;
    return value === 'ar' ? 'ar' : 'en';
}

export const dict = {
    en: {
        loading: 'Loading books...',
        loadingLetters: ['A', 'B', 'C'],
        home: {
            subtitle: 'Browse and discover books for kids',
            adminLogin: 'Admin Login',
            searchPlaceholder: 'Search by title or author...',
            noBooks: 'No books found.',
            by: 'by',
        },

         login: {
            title: 'تسجيل الدخول',
            subtitle: 'Log in to manage the library',
            username: 'Username',
            password: 'Password',
            loggingIn: 'Logging in...',
            logIn: 'Log In',
            loginFailed: 'Login failed',
        },
         common: {
            backToHome: 'Back to Home',
            edit: 'Edit',
            by: 'by',
        },
        books: {
            title: 'Manage Books',
            subtitle: 'Add, edit, and browse the library catalog',
            addBook: 'Add Book',
            noBooks: 'No books yet.',
        },
        newBook: {
            title: 'Add Book',
            subtitle: 'Add a new title to the catalog',
            bookId: 'Book ID',
            bookTitle: 'Title',
            author: 'Author',
            ageGroup: 'Age Group (optional)',
            coverUrl: 'Cover Image URL (optional)',
            adding: 'Adding...',
            addBook: 'Add Book',
            failedToAdd: 'Failed to add book',
        },
         newStudent: {
            title: 'Add Student',
            subtitle: 'Register a new student',
            studentId: 'Student ID',
            name: 'Name',
            grade: 'Grade (optional)',
            phone: 'Phone (optional)',
            adding: 'Adding...',
            addStudent: 'Add Student',
            failedToAdd: 'Failed to add student',
        },
        borrows: {
            title: 'Manage Borrows',
            subtitle: "Track which books are out and when they're due back",
            backToHome: 'Back to Home',
            newBorrow: 'New Borrow',
            noBorrows: 'No borrows yet.',
            borrowed: 'borrowed',
            returnedOn: 'returned',
            active: 'Active',
            returned: 'Returned',
            saving: 'Saving...',
            markReturned: 'Mark Returned',
        },



    },
    ar: {
        loading: 'جاري تحميل الكتب...',
        loadingLetters: ['أ', 'ب', 'ت'],
        home: {
            subtitle: 'تصفح واكتشف كتب الأطفال',
            adminLogin: 'تسجيل دخول المشرف',
            searchPlaceholder: 'ابحث بالعنوان أو المؤلف...',
            noBooks: 'لا توجد كتب.',
            by: 'بواسطة',
        },

         login: {
            title: 'تسجيل الدخول',
            subtitle: 'سجّل الدخول لإدارة المكتبة',
            username: 'اسم المستخدم',
            password: 'كلمة المرور',
            loggingIn: 'جارٍ تسجيل الدخول...',
            logIn: 'تسجيل الدخول',
            loginFailed: 'فشل تسجيل الدخول',
        },
          common: {
            backToHome: 'العودة للرئيسية',
            edit: 'تعديل',
            by: 'بواسطة',
        },
        books: {
            title: 'إدارة الكتب',
            subtitle: 'أضف وعدّل وتصفّح فهرس الكتب',
            addBook: 'إضافة كتاب',
            noBooks: 'لا توجد كتب بعد.',
        },
         newBook: {
            title: 'إضافة كتاب',
            subtitle: 'أضف عنواناً جديداً إلى الفهرس',
            bookId: 'رقم الكتاب',
            bookTitle: 'العنوان',
            author: 'المؤلف',
            ageGroup: 'الفئة العمرية (اختياري)',
            coverUrl: 'رابط صورة الغلاف (اختياري)',
            adding: 'جارٍ الإضافة...',
            addBook: 'إضافة كتاب',
            failedToAdd: 'فشل في إضافة الكتاب',
        },
         newStudent: {
            title: 'إضافة طالب',
            subtitle: 'سجّل طالباً جديداً',
            studentId: 'رقم الطالب',
            name: 'الاسم',
            grade: 'الصف (اختياري)',
            phone: 'الهاتف (اختياري)',
            adding: 'جارٍ الإضافة...',
            addStudent: 'إضافة طالب',
            failedToAdd: 'فشل في إضافة الطالب',
        },
        borrows: {
            title: 'إدارة الاستعارات',
            subtitle: 'تتبع الكتب المستعارة وموعد إعادتها',
            backToHome: 'العودة للرئيسية',
            newBorrow: 'استعارة جديدة',
            noBorrows: 'لا توجد استعارات بعد.',
            borrowed: 'استُعير في',
            returnedOn: 'أُعيد في',
            active: 'نشطة',
            returned: 'تم إرجاعها',
            saving: 'جارٍ الحفظ...',
            markReturned: 'تسجيل الإرجاع',
        },


    },
} as const;

export function t(locale: Locale) {
    return dict[locale];
}