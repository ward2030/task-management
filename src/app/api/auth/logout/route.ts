import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST() {
  await deleteSession();

  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');

  return response;
}
