import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// الحصول على جميع المهام
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const archived = searchParams.get('archived');

  const where: { isArchived?: boolean } = {};
  
  // إذا كان يطلب المهام المؤرشفة فقط
  if (archived === 'true') {
    where.isArchived = true;
  }

  const tasks = await db.task.findMany({
    where,
    include: {
      creator: {
        select: { id: true, name: true, username: true, role: true, department: true },
      },
      assignee: {
        select: { id: true, name: true, username: true, role: true, department: true },
      },
      comments: {
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      ratings: {
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tasks });
}

// إنشاء مهمة جديدة
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, status, priority, department, dueDate, assigneeId } = body;

    if (!title || !department) {
      return NextResponse.json(
        { error: 'العنوان والقسم مطلوبان' },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        department,
        dueDate: dueDate ? new Date(dueDate) : null,
        creatorId: user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        creator: {
          select: { id: true, name: true, username: true, role: true, department: true },
        },
        assignee: {
          select: { id: true, name: true, username: true, role: true, department: true },
        },
      },
    });

    // تسجيل نشاط الإنشاء
    await db.activity.create({
      data: {
        action: 'CREATE',
        details: `تم إنشاء مهمة جديدة`,
        userId: user.id,
        taskId: task.id,
      },
    });

    // إنشاء إشعار للموظف المسند إليه
    if (assigneeId && assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: assigneeId,
          title: 'مهمة جديدة',
          message: `تم إسناد مهمة "${title}" إليك بواسطة ${user.name}`,
        },
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المهمة' },
      { status: 500 }
    );
  }
}
