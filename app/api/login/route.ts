import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  const { userName, password } = await request.json();

  if (!userName || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 }
    );
  }

  const rows = await sql`
    SELECT user_id, user_name, password, role
    FROM library_users
    WHERE user_name = ${userName}
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }

  const user = rows[0] as {
    user_id: number;
    user_name: string;
    password: string;
    role: string;
  };

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid username or password' },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set('session_user', String(user.user_id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ success: true, role: user.role });
}