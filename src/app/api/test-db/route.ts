import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({
      status: 'success',
      message: 'الاتصال بقاعدة البيانات ناجح! ✅',
      result: result
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'فشل الاتصال بقاعدة البيانات ❌',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
