import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيح' },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, user.password)) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيح' },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
      },
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 أيام
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الدخول' },
      { status: 500 }
    );
  }
}
