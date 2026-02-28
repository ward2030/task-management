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
      ratings: {
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
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
    const { 
      title, description, status, priority, department, 
      dueDate, assigneeId, isArchived, archivedAt 
    } = body;

    // التحقق من وجود المهمة
    const existingTask = await db.task.findUnique({
      where: { id },
      select: { 
        assigneeId: true, 
        title: true, 
        status: true,
        isArchived: true 
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'المهمة غير موجودة' }, { status: 404 });
    }

    // إعداد بيانات التحديث
    const updateData: Record<string, unknown> = {};
    let activityAction = 'UPDATE';
    let activityDetails = '';

    // تحديث الحقول المتغيرة
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) {
      updateData.status = status;
      if (status !== existingTask.status) {
        activityAction = 'STATUS_CHANGE';
        activityDetails = `تغيير الحالة من "${getStatusText(existingTask.status)}" إلى "${getStatusText(status)}"`;
        if (status === 'DONE') {
          updateData.completedAt = new Date();
        }
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (department !== undefined) updateData.department = department;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) {
      updateData.assigneeId = assigneeId || null;
      if (assigneeId && assigneeId !== existingTask.assigneeId) {
        activityAction = 'ASSIGN';
        activityDetails = 'تم إسناد المهمة';
      }
    }
    if (isArchived !== undefined) {
      updateData.isArchived = isArchived;
      updateData.archivedAt = archivedAt ? new Date(archivedAt) : null;
      if (isArchived !== existingTask.isArchived) {
        activityAction = 'ARCHIVE';
        activityDetails = isArchived ? 'تم أرشفة المهمة' : 'تم استعادة المهمة من الأرشيف';
      }
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, username: true, role: true, department: true },
        },
        assignee: {
          select: { id: true, name: true, username: true, role: true, department: true },
        },
      },
    });

    // تسجيل النشاط
    await db.activity.create({
      data: {
        action: activityAction,
        details: activityDetails || 'تم تحديث المهمة',
        userId: user.id,
        taskId: id,
      },
    });

    // إشعار إذا تغير المسند إليه
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: assigneeId,
          title: 'تم إسناد مهمة إليك',
          message: `تم إسناد مهمة "${task.title}" إليك`,
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

  // الحصول على معلومات المهمة قبل الحذف
  const task = await db.task.findUnique({
    where: { id },
    select: { title: true },
  });

  // حذف المهمة (سيتم حذف الأنشطة المرتبطة تلقائياً بسبب onDelete: SetNull)
  await db.task.delete({ where: { id } });

  // تسجيل نشاط الحذف
  await db.activity.create({
    data: {
      action: 'DELETE',
      details: `تم حذف المهمة: ${task?.title || 'غير معروف'}`,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true });
}

// دالة مساعدة لتحويل حالة المهمة إلى نص عربي
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    TODO: 'قيد الانتظار',
    IN_PROGRESS: 'قيد التنفيذ',
    IN_REVIEW: 'قيد المراجعة',
    DONE: 'مكتملة',
  };
  return statusMap[status] || status;
}
