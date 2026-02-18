import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/session';
import { getUserById } from '@/lib/db/users';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
    },
  });
}
