import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// جلب تقييمات مهمة
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'معرف المهمة مطلوب' }, { status: 400 });
    }

    const ratings = await db.taskRating.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // حساب متوسط التقييم
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    return NextResponse.json({ ratings, avgRating });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// إضافة تقييم
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { taskId, rating, comment } = await request.json();

    if (!taskId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    // التحقق من عدم تكرار التقييم
    const existing = await db.taskRating.findUnique({
      where: { taskId_userId: { taskId, userId: user.id } },
    });

    if (existing) {
      // تحديث التقييم الموجود
      const updated = await db.taskRating.update({
        where: { id: existing.id },
        data: { rating, comment },
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      });
      return NextResponse.json({ rating: updated });
    }

    // إنشاء تقييم جديد
    const newRating = await db.taskRating.create({
      data: {
        taskId,
        userId: user.id,
        rating,
        comment,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });

    // إضافة نشاط
    await db.activity.create({
      data: {
        action: 'RATING',
        details: `تقييم: ${rating} نجوم`,
        userId: user.id,
        taskId,
      },
    });

    return NextResponse.json({ rating: newRating });
  } catch (error) {
    console.error('Error creating rating:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
