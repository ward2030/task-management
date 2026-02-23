import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    const usersCount = await prisma.user.count();

    if (usersCount > 0) {
      await prisma.$disconnect();
      return NextResponse.json({
        status: 'success',
        message: 'النظام مُهيأ بالفعل',
        usersCount: usersCount
      });
    }

    // تشفير كلمة المرور بنفس طريقة auth.ts (sha256)
    const hashedPassword = createHash('sha256').update('admin123').digest('hex');

    await prisma.user.create({
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
      message: 'تم إنشاء حساب المدير! ✅',
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
