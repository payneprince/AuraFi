type AppName = 'aurabank' | 'auravest';

const hasBrowser = () => typeof window !== 'undefined';

const snapshotKey = (appName: AppName, userId: string) => `aurasuite_${appName}_state_${userId}`;
const activeUserKey = (appName: AppName) => `aurasuite_${appName}_active_user`;

const captureGenericState = (genericKeys: string[]) => {
  const snapshot: Record<string, string | null> = {};
  for (const key of genericKeys) {
    snapshot[key] = window.localStorage.getItem(key);
  }
  return snapshot;
};

const applyGenericState = (
  genericKeys: string[],
  snapshot: Record<string, string | null> | null,
  defaults: Record<string, string>,
) => {
  for (const key of genericKeys) {
    const nextValue = snapshot && Object.prototype.hasOwnProperty.call(snapshot, key)
      ? snapshot[key]
      : (defaults[key] ?? null);

    if (nextValue === null || nextValue === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, nextValue);
    }
  }
};

export const switchScopedAppStorage = (params: {
  appName: AppName;
  userId: string;
  genericKeys: string[];
  defaults: Record<string, string>;
}) => {
  if (!hasBrowser()) return;

  const normalizedUserId = String(params.userId || '').trim();
  if (!normalizedUserId) return;

  const currentActiveUserId = window.localStorage.getItem(activeUserKey(params.appName));

  if (currentActiveUserId && currentActiveUserId !== normalizedUserId) {
    const currentSnapshot = captureGenericState(params.genericKeys);
    window.localStorage.setItem(snapshotKey(params.appName, currentActiveUserId), JSON.stringify(currentSnapshot));
  }

  let targetSnapshot: Record<string, string | null> | null = null;
  try {
    const raw = window.localStorage.getItem(snapshotKey(params.appName, normalizedUserId));
    targetSnapshot = raw ? (JSON.parse(raw) as Record<string, string | null>) : null;
  } catch {
    targetSnapshot = null;
  }

  applyGenericState(params.genericKeys, targetSnapshot, params.defaults);
  window.localStorage.setItem(activeUserKey(params.appName), normalizedUserId);
};

export const persistScopedAppStorage = (appName: AppName, userId: string, genericKeys: string[]) => {
  if (!hasBrowser()) return;
  const normalizedUserId = String(userId || '').trim();
  if (!normalizedUserId) return;

  const snapshot = captureGenericState(genericKeys);
  window.localStorage.setItem(snapshotKey(appName, normalizedUserId), JSON.stringify(snapshot));
  window.localStorage.setItem(activeUserKey(appName), normalizedUserId);
};