import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// تحديد جميع الإشعارات كمقروءة
export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  await db.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
