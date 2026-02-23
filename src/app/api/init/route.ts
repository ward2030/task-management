import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    const usersCount = await prisma.user.count();

    if (usersCount > 0) {
      return NextResponse.json({
        status: 'success',
        message: 'النظام مُهيأ بالفعل',
        usersCount: usersCount
      });
    }

    const hashedPassword = bcrypt.hashSync('admin123', 10);

    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: 'المدير العام',
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'تم إنشاء حساب المدير! ✅',
      admin: { username: 'admin', password: 'admin123' }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
