import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { validateUserCredentials } from "./services/user-service"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          plan: token.plan,
          bio: token.bio,
          theme: token.theme,
          image: token.image,
          isActive: token.isActive,
        },
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Quando o usuário faz login
      if (user) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          plan: (user as any).plan,
          bio: (user as any).bio,
          theme: (user as any).theme,
          image: user.image,
          isActive: (user as any).isActive,
        }
      }

      // Quando a sessão é atualizada
      if (trigger === "update" && session) {
        return { ...token, ...session.user }
      }

      return token
    },
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const [user, error] = await validateUserCredentials(credentials.email, credentials.password)

        if (error || !user) {
          console.error("Authentication error:", error)
          return null
        }

        // Check if user is inactive
        if (user.isActive === false) {
          throw new Error("Sua conta foi desativada. Entre em contato com o administrador do sistema.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          bio: user.bio,
          theme: user.theme,
          image: user.image,
          isActive: user.isActive,
        }
      },
    }),
  ],
}
