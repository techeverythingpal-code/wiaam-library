import { getLocale } from '@/lib/i18n-server';
import { t } from '@/lib/i18n';
import LoginForm from './login-form';

export default async function LoginPage() {
    const locale = await getLocale();
    const { login, common } = t(locale);

    return <LoginForm
        locale={locale}
        text={{ ...login, backToHome: common.backToHome }}

    />;
}