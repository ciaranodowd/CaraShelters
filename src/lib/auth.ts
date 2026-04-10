import { NextAuthOptions, getServerSession } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, image: user.image }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        // Attach org memberships
        const orgs = await prisma.userOrganization.findMany({
          where: { userId: token.id as string },
          include: { organization: { select: { id: true, name: true, slug: true } } },
        })
        session.user.organizations = orgs.map(o => ({
          id: o.organization.id,
          name: o.organization.name,
          slug: o.organization.slug,
          role: o.role,
        }))
      }
      return session
    },
  },
}

export const getSession = () => getServerSession(authOptions)

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) throw new Error("Unauthorized")
  return session
}

export async function requireOrgAccess(orgSlug: string, minRole?: string) {
  const session = await requireAuth()
  const org = session.user.organizations?.find(o => o.slug === orgSlug)
  if (!org) throw new Error("Forbidden")
  if (minRole === "ADMIN" && org.role !== "ADMIN") throw new Error("Forbidden")
  return { session, org }
}
