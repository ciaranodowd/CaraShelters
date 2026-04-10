import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrgSettingsForm } from "./_components/org-settings-form"
import { TeamSettings } from "./_components/team-settings"
import { GdprSettings } from "./_components/gdpr-settings"

export const dynamic = 'force-dynamic'

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { tab?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    include: {
      users: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })
  if (!org) notFound()

  const membership = org.users.find(u => u.userId === session.user.id)
  if (!membership) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">{org.name}</p>
      </div>

      <Tabs defaultValue={searchParams.tab ?? "general"}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="gdpr">GDPR</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <OrgSettingsForm org={org} isAdmin={membership.role === "ADMIN"} />
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamSettings org={org} members={org.users} currentUserId={session.user.id} isAdmin={membership.role === "ADMIN"} />
        </TabsContent>

        <TabsContent value="gdpr" className="mt-4">
          <GdprSettings orgId={org.id} orgSlug={params.orgSlug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
