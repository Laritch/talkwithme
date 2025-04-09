import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';

// Mock user database - in a real app this would be a database call
const users = [
  {
    id: '1',
    name: 'Prof. Johnson',
    email: 'professor@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'instructor',
    avatar: '/avatars/instructor.png',
  },
  {
    id: '2',
    name: 'Alex Chen',
    email: 'student1@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'student',
    avatar: '/avatars/student1.png',
  },
  {
    id: '3',
    name: 'Maria Garcia',
    email: 'student2@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'student',
    avatar: '/avatars/student2.png',
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Find user in the mock database
        const user = users.find(user => user.email === credentials.email);

        if (!user) {
          return null;
        }

        // Check if password matches
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        // Return user without password
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role and avatar to token when user signs in
      if (user) {
        token.role = user.role;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and avatar to session from token
      if (session.user) {
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string;
        session.user.id = token.sub as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
