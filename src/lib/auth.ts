import { db } from './db';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

// تشفير كلمة المرور
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// التحقق من كلمة المرور
export function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// إنشاء رمز الجلسة
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// إنشاء جلسة جديدة
export async function createSession(userId: string) {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

// التحقق من الجلسة
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.session.delete({ where: { token } });
    }
    return null;
  }

  return session;
}

// حذف الجلسة
export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }
}

// الحصول على المستخدم الحالي
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}
