import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

// تحديث مستخدم
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;

  if (!currentUser) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // فقط المدير والمنسق يمكنهم تعديل المستخدمين
  if (currentUser.role === 'EMPLOYEE') {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية لتعديل المستخدمين' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, role, department, password, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.password = hashPassword(password);

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث المستخدم' },
      { status: 500 }
    );
  }
}

// حذف مستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;

  if (!currentUser) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // فقط المدير يمكنه حذف المستخدمين
  if (currentUser.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'ليس لديك صلاحية لحذف المستخدمين' },
      { status: 403 }
    );
  }

  // لا يمكن حذف النفس
  if (currentUser.id === id) {
    return NextResponse.json(
      { error: 'لا يمكنك حذف حسابك الخاص' },
      { status: 400 }
    );
  }

  await db.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
