import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PawPrint, Users, Heart, DollarSign, TrendingUp } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true, name: true } })
  if (!org) notFound()

  const [
    totalAnimals,
    availableAnimals,
    inFosterAnimals,
    pendingApps,
    ,
    monthDonations,
    recentAnimals,
    recentApps,
  ] = await Promise.all([
    prisma.animal.count({ where: { organizationId: org.id } }),
    prisma.animal.count({ where: { organizationId: org.id, status: "AVAILABLE" } }),
    prisma.animal.count({ where: { organizationId: org.id, status: "FOSTERED" } }),
    prisma.adoptionApplication.count({ where: { organizationId: org.id, status: "PENDING" } }),
    prisma.adopter.count({ where: { organizationId: org.id } }),
    prisma.donation.aggregate({
      where: {
        organizationId: org.id,
        status: "COMPLETED",
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
      _sum: { amount: true },
    }),
    prisma.animal.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, species: true, status: true, breed: true, intakeDate: true },
    }),
    prisma.adoptionApplication.findMany({
      where: { organizationId: org.id, status: { in: ["PENDING", "HOME_CHECK_SCHEDULED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { animal: { select: { name: true } } },
    }),
  ])

  const stats = [
    { label: "Total animals", value: totalAnimals, icon: PawPrint, sub: `${availableAnimals} available`, href: `/${params.orgSlug}/animals` },
    { label: "In foster", value: inFosterAnimals, icon: Heart, sub: "currently fostered", href: `/${params.orgSlug}/animals?status=IN_FOSTER` },
    { label: "Pending applications", value: pendingApps, icon: Users, sub: "awaiting review", href: `/${params.orgSlug}/adoptions`, alert: pendingApps > 0 },
    { label: "Donations this month", value: formatCurrency(Number(monthDonations._sum.amount ?? 0)), icon: DollarSign, sub: "EUR", href: `/${params.orgSlug}/donations` },
  ]

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_FOSTER: "bg-blue-100 text-blue-800",
    ADOPTED: "bg-purple-100 text-purple-800",
    MEDICAL_HOLD: "bg-red-100 text-red-800",
    QUARANTINE: "bg-yellow-100 text-yellow-800",
    INTAKE: "bg-orange-100 text-orange-800",
    DECEASED: "bg-slate-100 text-slate-500",
  }

  const appStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    HOME_CHECK: "bg-blue-100 text-blue-800",
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{org.name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Dashboard overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.alert ? "bg-yellow-100" : "bg-primary/10"}`}>
                  <stat.icon className={`h-4 w-4 ${stat.alert ? "text-yellow-600" : "text-primary"}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent animals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent animals</CardTitle>
            <Link href={`/${params.orgSlug}/animals`} className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentAnimals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No animals yet — <Link href={`/${params.orgSlug}/animals/new`} className="text-primary hover:underline">add your first</Link></p>
            ) : (
              <div className="space-y-3">
                {recentAnimals.map(animal => (
                  <Link key={animal.id} href={`/${params.orgSlug}/animals/${animal.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{animal.name}</p>
                      <p className="text-xs text-muted-foreground">{animal.species} {animal.breed ? `· ${animal.breed}` : ""}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[animal.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {animal.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Applications needing action</CardTitle>
            <Link href={`/${params.orgSlug}/adoptions`} className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No pending applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentApps.map(app => (
                  <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground">For {app.animal.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${appStatusColors[app.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Add animal", href: `/${params.orgSlug}/animals/new` },
              { label: "Add person", href: `/${params.orgSlug}/people/new` },
              { label: "Record donation", href: `/${params.orgSlug}/donations/new` },
              { label: "View public portal", href: `/${params.orgSlug}/portal` },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1.5 px-3 text-sm">
                  {action.label}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
