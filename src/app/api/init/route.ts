import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// تشفير كلمة المرور بنفس طريقة auth.ts
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // حذف جميع المستخدمين والجلسات القديمة
    console.log('Deleting old data...');
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('Old data deleted');

    // إنشاء مستخدم مدير جديد
    const hashedPassword = hashPassword('admin123');

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'المدير العام',
        role: 'ADMIN',
      },
    });

    await prisma.$disconnect();

    return NextResponse.json({
      status: 'success',
      message: 'تم إنشاء حساب المدير بنجاح! ✅',
      admin: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    await prisma.$disconnect();
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
