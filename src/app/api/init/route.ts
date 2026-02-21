import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// تهيئة النظام - إنشاء مستخدم مدير افتراضي
export async function GET() {
  try {
    // التحقق من وجود مستخدمين
    const usersCount = await db.user.count();

    if (usersCount > 0) {
      return NextResponse.json({
        initialized: true,
        message: 'النظام مُهيأ بالفعل',
      });
    }

    // إنشاء مستخدم مدير افتراضي
    const hashedPassword = hashPassword('admin123');

    const admin = await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'المدير العام',
        role: 'ADMIN',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    });

    return NextResponse.json({
      initialized: true,
      message: 'تم إنشاء حساب المدير الافتراضي',
      admin: {
        username: 'admin',
        password: 'admin123',
      },
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تهيئة النظام' },
      { status: 500 }
    );
  }
}
