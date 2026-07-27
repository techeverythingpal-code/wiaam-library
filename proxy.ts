import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/admin'];
const publicOnlyRoutes = ['/login'];

export default function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const sessionUser = req.cookies.get('session_user')?.value;

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