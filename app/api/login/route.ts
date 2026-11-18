import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from '@/lib/session';
import { apiError, readJson, serverError } from '@/lib/api';

export async function POST(request: Request) {
  const body = await readJson(request);
  const userName = typeof body.userName === 'string' ? body.userName : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!userName || !password) {
    return apiError('loginRequired', 400);
  }

  try {
    const rows = await sql`
      SELECT user_id, user_name, password, role
      FROM library_users
      WHERE user_name = ${userName}
    `;

    const user = rows[0] as
      | { user_id: number; user_name: string; password: string; role: string }
      | undefined;

    // Same message for "no such user" and "wrong password",
    // so nobody can find out which usernames exist.
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return apiError('loginInvalid', 401);
    }

    const token = await createSessionToken(user.user_id);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (err) {
    return serverError('Login failed', err);
  }
}