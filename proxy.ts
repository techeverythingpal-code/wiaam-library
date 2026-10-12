import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

const protectedRoutes = ['/admin'];
const publicOnlyRoutes = ['/login'];

export default async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const sessionUser = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

    const isProtectedRoute = protectedRoutes.some((route) =>
        path.startsWith(route)
    );
    const isPublicOnlyRoute = publicOnlyRoutes.includes(path);

    if (isProtectedRoute && !sessionUser) {
        return NextResponse.redirect(new URL('/login', req.nextUrl));
    }

    if (isPublicOnlyRoute && sessionUser) {
        return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/login'],
};