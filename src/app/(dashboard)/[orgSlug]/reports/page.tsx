import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SPECIES_LABELS, STATUS_LABELS } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"

export default async function ReportsPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-IE", { month: "short", year: "2-digit" }) }
  }).reverse()

  const [
    animalsBySpecies,
    animalsByStatus,
    completedApps,
    donationMonths,
    intakeByMonth,
    outcomeByMonth,
  ] = await Promise.all([
    prisma.animal.groupBy({ by: ["species"], where: { organizationId: org.id }, _count: true }),
    prisma.animal.groupBy({ by: ["status"], where: { organizationId: org.id }, _count: true }),
    prisma.adoptionApplication.count({ where: { organizationId: org.id, status: "COMPLETED" } }),
    Promise.all(months.map(m =>
      prisma.donation.aggregate({
        where: {
          organizationId: org.id,
          status: "COMPLETED",
          createdAt: {
            gte: new Date(m.year, m.month, 1),
            lt: new Date(m.year, m.month + 1, 1),
          },
        },
        _sum: { amount: true },
        _count: true,
      }).then(r => ({ ...m, total: Number(r._sum.amount ?? 0), count: r._count }))
    )),
    Promise.all(months.map(m =>
      prisma.animal.count({
        where: {
          organizationId: org.id,
          intakeDate: {
            gte: new Date(m.year, m.month, 1),
            lt: new Date(m.year, m.month + 1, 1),
          },
        },
      }).then(count => ({ ...m, count }))
    )),
    Promise.all(months.map(m =>
      prisma.adoptionApplication.count({
        where: {
          organizationId: org.id,
          status: "COMPLETED",
          updatedAt: {
            gte: new Date(m.year, m.month, 1),
            lt: new Date(m.year, m.month + 1, 1),
          },
        },
      }).then(count => ({ ...m, count }))
    )),
  ])

  const maxDonation = Math.max(...donationMonths.map(m => m.total), 1)
  const maxIntake = Math.max(...intakeByMonth.map(m => m.count), 1)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Animals by species */}
        <Card>
          <CardHeader><CardTitle className="text-base">Animals by species</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animalsBySpecies.map(row => (
                <div key={row.species} className="flex items-center justify-between">
                  <span className="text-sm">{SPECIES_LABELS[row.species] ?? row.species}</span>
                  <Badge variant="secondary">{row._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Animals by status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Animals by status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {animalsByStatus.map(row => (
                <div key={row.status} className="flex items-center justify-between">
                  <span className="text-sm">{STATUS_LABELS[row.status] ?? row.status}</span>
                  <Badge variant="secondary">{row._count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Donations chart */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Monthly donations (last 6 months)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {donationMonths.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {m.total > 0 ? formatCurrency(m.total) : ""}
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-sm relative" style={{ height: "100px" }}>
                    <div
                      className="absolute bottom-0 w-full bg-primary rounded-t-sm transition-all"
                      style={{ height: `${(m.total / maxDonation) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intakes chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly intakes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {intakeByMonth.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  {m.count > 0 && <span className="text-xs font-medium">{m.count}</span>}
                  <div className="w-full bg-slate-100 rounded-t-sm" style={{ height: "80px" }}>
                    <div
                      className="w-full bg-blue-400 rounded-t-sm transition-all"
                      style={{ height: `${(m.count / maxIntake) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Outcomes chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly adoptions</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {outcomeByMonth.map(m => {
                const maxO = Math.max(...outcomeByMonth.map(x => x.count), 1)
                return (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                    {m.count > 0 && <span className="text-xs font-medium">{m.count}</span>}
                    <div className="w-full bg-slate-100 rounded-t-sm" style={{ height: "80px" }}>
                      <div
                        className="w-full bg-green-400 rounded-t-sm transition-all"
                        style={{ height: `${(m.count / maxO) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key stats */}
      <Card>
        <CardHeader><CardTitle className="text-base">All-time totals</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: "Animals in system", value: animalsBySpecies.reduce((s, r) => s + r._count, 0) },
              { label: "Total adoptions", value: completedApps },
              { label: "Total donations this year", value: formatCurrency(donationMonths.reduce((s, m) => s + m.total, 0)) },
              { label: "Fosters active", value: "—" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
