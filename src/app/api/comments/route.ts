import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// إضافة تعليق
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, content } = body;

    if (!taskId || !content) {
      return NextResponse.json(
        { error: 'المهمة والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // الحصول على المهمة لمعرفة المسند إليه
    const task = await db.task.findUnique({
      where: { id: taskId },
      select: { assigneeId: true, title: true, creatorId: true },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'المهمة غير موجودة' },
        { status: 404 }
      );
    }

    const comment = await db.comment.create({
      data: {
        taskId,
        userId: user.id,
        content,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });

    // إرسال إشعار للمسند إليه (إذا لم يكن هو من أضاف التعليق)
    if (task.assigneeId && task.assigneeId !== user.id) {
      await db.notification.create({
        data: {
          userId: task.assigneeId,
          title: 'تعليق جديد على مهمتك',
          message: `${user.name} علق على مهمة "${task.title}"`,
        },
      });
    }

    // إرسال إشعار لمنشئ المهمة (إذا لم يكن هو من أضاف التعليق)
    if (task.creatorId && task.creatorId !== user.id && task.creatorId !== task.assigneeId) {
      await db.notification.create({
        data: {
          userId: task.creatorId,
          title: 'تعليق جديد على مهمة أنشأتها',
          message: `${user.name} علق على مهمة "${task.title}"`,
        },
      });
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة التعليق' },
      { status: 500 }
    );
  }
}
