import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import NewStudentForm from './new-student-form';

export default async function NewStudentPage() {
    const locale = await getLocale();
    const { newStudent, common } = t(locale);

    return <NewStudentForm locale={locale} text={{ ...newStudent, addStudent: common.addStudent }} />;
}