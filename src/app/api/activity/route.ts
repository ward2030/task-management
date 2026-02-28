import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// جلب سجل النشاط
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const taskId = searchParams.get('taskId');

    const where: { taskId?: string } = {};
    if (taskId) {
      where.taskId = taskId;
    }

    const activities = await db.activity.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// إضافة نشاط جديد
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { action, details, taskId } = await request.json();

    const activity = await db.activity.create({
      data: {
        action,
        details,
        userId: user.id,
        taskId,
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, role: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
