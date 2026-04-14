import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function CampaignDetailPage({ params }: { params: { orgSlug: string; campaignId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.campaignId, organizationId: org.id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        include: { donor: { select: { firstName: true, lastName: true } } },
      },
    },
  })
  if (!campaign) notFound()

  const raised = campaign.donations
    .filter(d => d.status === "COMPLETED")
    .reduce((sum, d) => sum + Number(d.amount), 0)
  const pct = campaign.goalAmount ? Math.min(100, (raised / Number(campaign.goalAmount)) * 100) : null

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-slate-100 text-slate-600",
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/donations/campaigns`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{campaign.description}</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${campaign.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {campaign.isActive ? "Active" : "Archived"}
            </span>
          </div>
        </div>

        {/* Progress card */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-3xl font-bold text-slate-900">{formatCurrency(raised)}</p>
              {campaign.goalAmount && (
                <p className="text-sm text-slate-400">of {formatCurrency(Number(campaign.goalAmount))} goal</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{campaign.donations.filter(d => d.status === "COMPLETED").length}</p>
              <p className="text-sm text-slate-400">donors</p>
            </div>
          </div>
          {pct !== null && (
            <>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#4ade80" }} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{pct.toFixed(0)}% of goal reached</p>
            </>
          )}
          {(campaign.startsAt || campaign.endsAt) && (
            <p className="text-xs text-slate-400 mt-3">
              {campaign.startsAt ? `Starts ${formatDate(campaign.startsAt)}` : ""}
              {campaign.startsAt && campaign.endsAt ? " · " : ""}
              {campaign.endsAt ? `Ends ${formatDate(campaign.endsAt)}` : ""}
            </p>
          )}
        </div>

        {/* Donations list */}
        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Donations</h2>
            <span className="text-xs text-slate-400">{campaign.donations.length} total</span>
          </div>
          {campaign.donations.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No donations yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {campaign.donations.map(d => (
                <div key={d.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {d.donor ? `${d.donor.firstName} ${d.donor.lastName}` : d.donorName ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(d.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(d.amount))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[d.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
