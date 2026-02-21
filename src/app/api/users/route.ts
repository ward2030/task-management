import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

// الحصول على جميع المستخدمين
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      department: true,
      avatar: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

// إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // فقط المدير والمنسق يمكنهم إضافة مستخدمين
  if (currentUser.role === 'EMPLOYEE') {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية لإضافة مستخدمين' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { username, password, name, role, department } = body;

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // التحقق من عدم وجود المستخدم
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'اسم المستخدم موجود بالفعل' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const newUser = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: role || 'EMPLOYEE',
        department: department || null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}
