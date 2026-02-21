import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// الحصول على الإشعارات
export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  // عدد الإشعارات غير المقروءة
  const unreadCount = await db.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
