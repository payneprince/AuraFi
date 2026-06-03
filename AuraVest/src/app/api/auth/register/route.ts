import { NextRequest, NextResponse } from 'next/server';
import { createRegisteredUser } from '../../../../../../shared/user-registry';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string };
    const email = String(body?.email || '').trim();
    const password = String(body?.password || '');
    const name = String(body?.name || '').trim();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const user = await createRegisteredUser({ email, password, name, accountType: 'personal' });
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
