import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// الحصول على مهمة محددة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const task = await db.task.findUnique({
    where: { id },
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
    },
  });

  if (!task) {
    return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

// تحديث مهمة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, status, priority, department, dueDate, assigneeId } = body;

    // التحقق من وجود المهمة
    const existingTask = await db.task.findUnique({
      where: { id },
      select: { assigneeId: true, title: true },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    const task = await db.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        department,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        completedAt: status === 'DONE' ? new Date() : null,
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

    // إشعار إذا تغير المسند إليه
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: assigneeId,
          title: 'تم إسناد مهمة إليك',
          message: `تم إسناد مهمة "${title}" إليك`,
        },
      });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المهمة' },
      { status: 500 }
    );
  }
}

// حذف مهمة
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // التحقق من الصلاحيات - فقط المدير والمنسق يمكنهم الحذف
  if (user.role === 'EMPLOYEE') {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية لحذف المهام' },
      { status: 403 }
    );
  }

  await db.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
