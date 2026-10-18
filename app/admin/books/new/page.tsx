import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import { getCopiesText } from '@/lib/i18n-copies';
import NewBookForm from './new-book-form';

export default async function NewBookPage() {
    const locale = await getLocale();
    const { newBook, common } = t(locale);

    return (
        <NewBookForm
            locale={locale}
            text={{ ...newBook, addBook: common.addBook }}
            copiesText={getCopiesText(locale)}
        />
    );
}