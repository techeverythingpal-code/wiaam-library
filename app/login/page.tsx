import { getLocale, t } from '@/lib/i18n';
import LoginForm from './login-form';

export default async function LoginPage() {
    const locale = await getLocale();
    const { login } = t(locale);

    return <LoginForm locale={locale} text={login} />;
}