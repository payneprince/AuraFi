export interface UnifiedAuthSession {
  userId: string;
  email?: string;
  name?: string;
  sourceApp?: string;
  loggedInAt?: string;
  expiresAt?: string;
}

export const UNIFIED_AUTH_STORAGE_KEY = 'aurasuite_auth_session';
export const UNIFIED_AUTH_CHANNEL = 'aura-auth-sync';

const hasBrowser = () => typeof window !== 'undefined';

const parseSession = (raw: string | null): UnifiedAuthSession | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UnifiedAuthSession>;
    if (!parsed || typeof parsed.userId !== 'string' || !parsed.userId.trim()) {
      return null;
    }

    return {
      userId: parsed.userId,
      email: typeof parsed.email === 'string' ? parsed.email : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      sourceApp: typeof parsed.sourceApp === 'string' ? parsed.sourceApp : undefined,
      loggedInAt: typeof parsed.loggedInAt === 'string' ? parsed.loggedInAt : undefined,
      expiresAt: typeof parsed.expiresAt === 'string' ? parsed.expiresAt : undefined,
    };
  } catch {
    return null;
  }
};

const broadcastAuthChange = (session: UnifiedAuthSession | null) => {
  if (!hasBrowser() || typeof BroadcastChannel === 'undefined') return;

  try {
    const channel = new BroadcastChannel(UNIFIED_AUTH_CHANNEL);
    channel.postMessage({
      type: 'auth.session.changed',
      session,
      timestamp: new Date().toISOString(),
    });
    channel.close();
  } catch {
    // Ignore unsupported environments.
  }
};

export const readUnifiedAuthSession = (): UnifiedAuthSession | null => {
  if (!hasBrowser()) return null;
  return parseSession(window.localStorage.getItem(UNIFIED_AUTH_STORAGE_KEY));
};

export const writeUnifiedAuthSession = (session: UnifiedAuthSession) => {
  if (!hasBrowser()) return;

  const normalized: UnifiedAuthSession = {
    ...session,
    userId: String(session.userId || '').trim(),
    loggedInAt: session.loggedInAt || new Date().toISOString(),
  };

  if (!normalized.userId) return;

  window.localStorage.setItem(UNIFIED_AUTH_STORAGE_KEY, JSON.stringify(normalized));
  broadcastAuthChange(normalized);
};

export const clearUnifiedAuthSession = () => {
  if (!hasBrowser()) return;
  window.localStorage.removeItem(UNIFIED_AUTH_STORAGE_KEY);
  broadcastAuthChange(null);
};

export const subscribeUnifiedAuthSession = (
  onChange: (session: UnifiedAuthSession | null) => void,
) => {
  if (!hasBrowser()) return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key !== UNIFIED_AUTH_STORAGE_KEY) return;
    onChange(parseSession(event.newValue));
  };

  window.addEventListener('storage', onStorage);

  let channel: BroadcastChannel | null = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel(UNIFIED_AUTH_CHANNEL);
      channel.onmessage = () => {
        onChange(readUnifiedAuthSession());
      };
    } catch {
      channel = null;
    }
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    if (channel) {
      channel.close();
    }
  };
};
