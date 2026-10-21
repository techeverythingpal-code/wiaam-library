// After login we may send the person back to the page they wanted.
// That address comes from the URL, so anyone can put anything in it.
// We only accept admin pages of this site; anything else becomes "/admin".

const DEFAULT_PATH = '/admin';

export function safeNextPath(value: string | null | undefined): string {
    if (!value) return DEFAULT_PATH;

    // Must be "/admin" itself, or a page under it ("/admin/books", "/admin?x=1").
    // Because it must start with a single "/admin", it can never be another
    // website like "//evil.com" or "https://evil.com".
    const isAdminPath =
        value === '/admin' || value.startsWith('/admin/') || value.startsWith('/admin?');

    if (!isAdminPath) return DEFAULT_PATH;

    // Reject backslashes and hidden control characters (used in redirect tricks).
    if (value.includes('\\') || /[\u0000-\u001f]/.test(value)) return DEFAULT_PATH;

    return value;
}