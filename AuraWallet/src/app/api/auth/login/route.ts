import { NextRequest, NextResponse } from 'next/server';
import { validateRegisteredUser } from '../../../../../../shared/user-registry';

const DEMO_EMAIL = 'demo@aurafinance.com';
const DEMO_PASSWORD = 'demo123';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      return NextResponse.json({ id: '1', email: DEMO_EMAIL, name: 'Demo User' });
    }

    const user = await validateRegisteredUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
