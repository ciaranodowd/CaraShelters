import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Target, TrendingUp } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function CampaignsPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const campaigns = await prisma.campaign.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { donations: true } },
      donations: { where: { status: "COMPLETED" }, select: { amount: true } },
    },
  })

  const active = campaigns.filter(c => c.isActive)
  const archived = campaigns.filter(c => !c.isActive)

  function CampaignCard({ c }: { c: typeof campaigns[0] }) {
    const raised = c.donations.reduce((sum, d) => sum + Number(d.amount), 0)
    const pct = c.goalAmount ? Math.min(100, (raised / Number(c.goalAmount)) * 100) : null
    return (
      <Link href={`/${params.orgSlug}/donations/campaigns/${c.id}`}>
        <div className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 p-6 transition-colors cursor-pointer">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{c.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.description}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${c.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {c.isActive ? "Active" : "Archived"}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(raised)}</p>
              {c.goalAmount && (
                <p className="text-xs text-slate-400">of {formatCurrency(Number(c.goalAmount))} goal</p>
              )}
            </div>
            <p className="text-xs text-slate-400">{c._count.donations} donations</p>
          </div>
          {pct !== null && (
            <div className="h-1.5 bg-slate-100 rounded-full mt-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4ade80" }} />
            </div>
          )}
          {(c.startsAt || c.endsAt) && (
            <p className="text-xs text-slate-400 mt-3">
              {c.startsAt ? `From ${formatDate(c.startsAt)}` : ""}
              {c.startsAt && c.endsAt ? " · " : ""}
              {c.endsAt ? `Ends ${formatDate(c.endsAt)}` : ""}
            </p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <div>
          <Link href={`/${params.orgSlug}/donations`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to donations
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-0.5">{campaigns.length} campaigns total</p>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
            <Target className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No campaigns yet</p>
            <p className="text-sm text-slate-400 mt-1">Campaigns are created when donors give through your public portal</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Active ({active.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map(c => <CampaignCard key={c.id} c={c} />)}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Archived ({archived.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {archived.map(c => <CampaignCard key={c.id} c={c} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
