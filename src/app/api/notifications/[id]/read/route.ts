import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// تحديد الإشعار كمقروء
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  const { id } = await params;

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  await db.notification.update({
    where: { id, userId: user.id },
    data: { isRead: true },
  });

  return NextResponse.json({ success: true });
}
