import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export const dynamic = 'force-dynamic'

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { orgSlug: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true, name: true, slug: true },
  })
  if (!org) notFound()

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
    select: { role: true },
  })
  if (!membership) notFound()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar orgSlug={org.slug} orgName={org.name} />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav orgSlug={org.slug} />
    </div>
  )
}
