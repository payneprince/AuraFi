import { promises as fs } from 'fs';
import path from 'path';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
};

const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const colonIdx = stored.indexOf(':');
  if (colonIdx === -1) return false;
  const salt = stored.slice(0, colonIdx);
  const storedHash = stored.slice(colonIdx + 1);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  if (derived.length !== storedBuffer.length) return false;
  return timingSafeEqual(derived, storedBuffer);
};

export type RegisteredUser = {
  id: string;
  email: string;
  password: string;
  name: string;
  accountType: 'personal' | 'business';
  createdAt: string;
};

type UserRegistry = {
  users: RegisteredUser[];
};

const REGISTRY_FILE_PATH = path.join(process.cwd(), '..', 'shared', 'user-registry.json');

const readRegistry = async (): Promise<UserRegistry> => {
  const raw = await fs.readFile(REGISTRY_FILE_PATH, 'utf8');
  const parsed = JSON.parse(raw) as Partial<UserRegistry>;
  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
  };
};

const writeRegistry = async (registry: UserRegistry) => {
  await fs.writeFile(REGISTRY_FILE_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const nextUserId = (users: RegisteredUser[]) => {
  const highestId = users.reduce((maxId, user) => {
    const parsedId = Number.parseInt(String(user.id || ''), 10);
    return Number.isNaN(parsedId) ? maxId : Math.max(maxId, parsedId);
  }, 0);
  return String(highestId + 1);
};

export const listRegisteredUsers = async () => {
  const registry = await readRegistry();
  return registry.users;
};

export const findRegisteredUserByEmail = async (email: string) => {
  const registry = await readRegistry();
  const normalizedEmail = normalizeEmail(email);
  return registry.users.find((user) => normalizeEmail(user.email) === normalizedEmail) || null;
};

export const validateRegisteredUser = async (email: string, password: string) => {
  const user = await findRegisteredUserByEmail(email);
  if (!user) return null;
  const valid = await verifyPassword(password, user.password);
  if (!valid) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    accountType: user.accountType,
  };
};

export const createRegisteredUser = async (params: {
  email: string;
  password: string;
  name: string;
  accountType: 'personal' | 'business';
}) => {
  const registry = await readRegistry();
  const normalizedEmail = normalizeEmail(params.email);

  const existing = registry.users.find((user) => normalizeEmail(user.email) === normalizedEmail);
  if (existing) {
    throw new Error('A user with this email already exists.');
  }

  const newUser: RegisteredUser = {
    id: nextUserId(registry.users),
    email: normalizedEmail,
    password: await hashPassword(params.password),
    name: params.name.trim(),
    accountType: params.accountType,
    createdAt: new Date().toISOString(),
  };

  registry.users.push(newUser);
  await writeRegistry(registry);

  return newUser;
};