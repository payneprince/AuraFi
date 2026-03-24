import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { validateRegisteredUser } from '../../../../../../shared/user-registry';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await validateRegisteredUser(credentials.email, credentials.password);
        return user ? { id: user.id.toString(), email: user.email, name: user.name } : null;
      }
    })
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt(params: unknown) {
      const { token, user } = params as {
        token: { id?: string } & Record<string, unknown>;
        user?: { id?: string };
      };
      if (user) {
        token.id = String(user.id || token.id || '');
      }
      return token;
    },
    async session(params: unknown) {
      const { session, token } = params as {
        session: { expires: string; user?: Record<string, unknown> } & Record<string, unknown>;
        token: { id?: string } & Record<string, unknown>;
      };
      session.user = {
        ...(session.user || {}),
        id: String(token.id || ''),
      };
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
