import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const membership = await prisma.userOrganization.findFirst({
    where: { userId: session.user.id },
    include: { organization: { select: { slug: true } } },
    orderBy: { joinedAt: "asc" },
  })

  if (!membership) redirect("/onboarding")
  redirect(`/${(membership as any).organization.slug}`)
}
