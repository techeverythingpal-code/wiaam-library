import { getLocale, t } from '@/lib/i18n';
import NewBookForm from './new-book-form';

export default async function NewBookPage() {
    const locale = await getLocale();
    const { newBook, common } = t(locale);

    return <NewBookForm locale={locale} text={{ ...newBook, addBook: common.addBook }} />;
}