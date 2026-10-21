import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

export async function POST(request: NextRequest) {
    // 303 = "go to this page with a normal GET".
    // (The old redirect kept the POST method, so the browser sent a POST to the next page.)
    const response = NextResponse.redirect(new URL('/', request.url), 303);

    // Delete the session cookie by expiring it right now.
    // It must use the same path as when it was created, or the browser keeps it.
    response.cookies.set(SESSION_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return response;
}