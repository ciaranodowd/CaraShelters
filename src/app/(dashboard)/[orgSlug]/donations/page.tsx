import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, TrendingUp } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function DonationsPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [donations, monthTotal, yearTotal, campaigns] = await Promise.all([
    prisma.donation.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { donor: { select: { firstName: true, lastName: true } }, campaign: { select: { title: true } } },
    }),
    prisma.donation.aggregate({
      where: { organizationId: org.id, status: "COMPLETED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.donation.aggregate({
      where: { organizationId: org.id, status: "COMPLETED", createdAt: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.campaign.findMany({
      where: { organizationId: org.id, isActive: true },
      include: { _count: { select: { donations: true } },
        donations: { where: { status: "COMPLETED" }, select: { amount: true } } },
      take: 3,
    }),
  ])

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-slate-100 text-slate-600",
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Donations</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${params.orgSlug}/donations/campaigns`}>Campaigns</Link>
          </Button>
          <Button asChild>
            <Link href={`/${params.orgSlug}/donations/new`}>
              <Plus className="h-4 w-4 mr-1.5" /> Record donation
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(monthTotal._sum.amount ?? 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(yearTotal._sum.amount ?? 0))}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active campaigns */}
      {campaigns.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Active campaigns</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {campaigns.map(c => {
              const raised = c.donations.reduce((sum, d) => sum + Number(d.amount), 0)
              const pct = c.goalAmount ? Math.min(100, (raised / Number(c.goalAmount)) * 100) : null
              return (
                <Link key={c.id} href={`/${params.orgSlug}/donations/campaigns/${c.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-4">
                      <p className="font-semibold text-sm mb-1">{c.title}</p>
                      <p className="text-lg font-bold">{formatCurrency(raised)}</p>
                      {c.goalAmount && (
                        <>
                          <p className="text-xs text-muted-foreground">of {formatCurrency(Number(c.goalAmount))} goal</p>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-2">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{c._count.donations} donations</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Donations table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent donations</CardTitle>
        </CardHeader>
        <CardContent>
          {donations.length === 0 ? (
            <div className="text-center py-10">
              <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No donations yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {donations.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">
                      {d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : d.donorName ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.type.replace(/_/g, " ")}
                      {d.campaign ? ` · ${d.campaign.title}` : ""}
                      {" · "}{formatDate(d.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(d.amount))} {d.currency}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColors[d.status] ?? ""}`}>{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
