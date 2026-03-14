export type BrowserRegisteredUser = {
  id: string;
  email: string;
  name: string;
  password?: string;
  accountType?: 'personal' | 'business';
  createdAt?: string;
};

const BROWSER_USER_DIRECTORY_KEY = 'aurasuite_registered_users';

const hasBrowser = () => typeof window !== 'undefined';

const readUsers = (): BrowserRegisteredUser[] => {
  if (!hasBrowser()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BROWSER_USER_DIRECTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeUsers = (users: BrowserRegisteredUser[]) => {
  if (!hasBrowser()) return;
  window.localStorage.setItem(BROWSER_USER_DIRECTORY_KEY, JSON.stringify(users));
};

export const listBrowserRegisteredUsers = () => readUsers();

export const saveBrowserRegisteredUser = (user: BrowserRegisteredUser) => {
  const existingUsers = readUsers();
  const nextUsers = existingUsers.filter((entry) => String(entry.id) !== String(user.id) && entry.email.toLowerCase() !== user.email.toLowerCase());
  nextUsers.push({
    ...user,
    email: user.email.toLowerCase(),
  });
  writeUsers(nextUsers);
};

export const findBrowserRegisteredUserByEmail = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  return readUsers().find((user) => user.email.toLowerCase() === normalizedEmail) || null;
};

export const findBrowserRegisteredUserById = (userId: string | number) => {
  const normalizedUserId = String(userId);
  return readUsers().find((user) => String(user.id) === normalizedUserId) || null;
};