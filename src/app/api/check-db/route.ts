import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // عدد المستخدمين
    const usersCount = await prisma.user.count();
    
    // عدد المهام
    const tasksCount = await prisma.task.count();
    
    return NextResponse.json({
      status: 'success',
      database: process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : 'SQLite (Local)',
      url_prefix: process.env.DATABASE_URL?.substring(0, 40) + '...',
      usersCount: usersCount,
      tasksCount: tasksCount
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : 'SQLite (Local)',
      url_prefix: process.env.DATABASE_URL?.substring(0, 40) + '...'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
