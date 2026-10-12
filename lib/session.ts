export const SESSION_COOKIE = 'session_user';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds

const encoder = new TextEncoder();

function getSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('SESSION_SECRET is missing or shorter than 32 characters');
    }
    return secret;
}

async function sign(payload: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(getSecret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

function safeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

export async function createSessionToken(userId: number | string): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
    const payload = `${userId}.${expires}`;
    return `${payload}.${await sign(payload)}`;
}

// Returns the user ID if the token is genuine and not expired, otherwise null.
export async function verifySession(token: string | undefined): Promise<string | null> {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [userId, expires, signature] = parts;
    if (!/^\d+$/.test(userId) || !/^\d+$/.test(expires)) return null;

    const expected = await sign(`${userId}.${expires}`);
    if (!safeEqual(signature, expected)) return null;

    if (Number(expires) < Math.floor(Date.now() / 1000)) return null;

    return userId;
}