import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function PeoplePage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { tab?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const [adopters, fosters, volunteers, donors] = await Promise.all([
    prisma.adopter.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.foster.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.volunteer.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.donor.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ])

  const tab = searchParams.tab ?? "adopters"

  const personRow = (person: { id: string; firstName: string; lastName: string; email: string; createdAt: Date }, type: string) => (
    <Link key={person.id} href={`/${params.orgSlug}/people/${type}/${person.id}`}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {person.firstName[0]}{person.lastName[0]}
        </div>
        <div>
          <p className="font-medium text-sm">{person.firstName} {person.lastName}</p>
          <p className="text-xs text-muted-foreground">{person.email}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(person.createdAt)}</p>
    </Link>
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">People</h1>
        <Button asChild>
          <Link href={`/${params.orgSlug}/people/new?type=${tab.slice(0, -1)}`}>
            <Plus className="h-4 w-4 mr-1.5" /> Add person
          </Link>
        </Button>
      </div>

      <Tabs defaultValue={tab}>
        <TabsList>
          <TabsTrigger value="adopters">Adopters <Badge variant="secondary" className="ml-1.5 text-xs">{adopters.length}</Badge></TabsTrigger>
          <TabsTrigger value="fosters">Fosters <Badge variant="secondary" className="ml-1.5 text-xs">{fosters.length}</Badge></TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers <Badge variant="secondary" className="ml-1.5 text-xs">{volunteers.length}</Badge></TabsTrigger>
          <TabsTrigger value="donors">Donors <Badge variant="secondary" className="ml-1.5 text-xs">{donors.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="adopters" className="mt-4">
          <div className="rounded-xl border bg-card">
            {adopters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No adopters yet</p>
            ) : adopters.map(p => personRow(p, "adopters"))}
          </div>
        </TabsContent>

        <TabsContent value="fosters" className="mt-4">
          <div className="rounded-xl border bg-card">
            {fosters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No fosters yet</p>
            ) : fosters.map(p => (
              <Link key={p.id} href={`/${params.orgSlug}/people/fosters/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.approved ? (
                    <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">Approved</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  )}
                  <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(p.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="volunteers" className="mt-4">
          <div className="rounded-xl border bg-card">
            {volunteers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No volunteers yet</p>
            ) : volunteers.map(p => (
              <Link key={p.id} href={`/${params.orgSlug}/people/volunteers/${p.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {p.firstName[0]}{p.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground hidden sm:block">{Number(p.hoursLogged)}h logged</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{formatDate(p.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donors" className="mt-4">
          <div className="rounded-xl border bg-card">
            {donors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No donors yet</p>
            ) : donors.map(p => personRow(p, "donors"))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
