import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// جلب الرسائل
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // المحادثة مع مستخدم معين

    let messages;
    
    if (userId) {
      // جلب المحادثة مع مستخدم معين
      messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: user.id, receiverId: userId },
            { senderId: userId, receiverId: user.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true, username: true },
          },
        },
      });
    } else {
      // جلب آخر رسالة من كل محادثة
      messages = await db.message.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, username: true },
          },
        },
      });
    }

    // حساب الرسائل غير المقروءة
    const unreadCount = await db.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ messages, unreadCount });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// إرسال رسالة جديدة
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { receiverId, content } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const message = await db.message.create({
      data: {
        content,
        senderId: user.id,
        receiverId,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// تحديد الرسائل كمقروءة
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { senderId } = await request.json();

    await db.message.updateMany({
      where: {
        receiverId: user.id,
        senderId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
