// Session validation logic for AuraFinance SSO

import { users } from './mock-data.js';

export function validateUser(email, password) {
  const user = users.find(u => u.email === email && u.password === password);
  return user ? { id: user.id, email: user.email, name: user.name } : null;
}

export function getUserById(id) {
  return users.find(u => u.id === id);
}

// In a real app, use JWT or secure session management
export function createSession(user) {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
}

export function validateSession(session) {
  if (!session || !session.expires) return null;
  if (Date.now() > session.expires) return null;
  return getUserById(session.userId);
}
