import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, FileText, DollarSign } from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function DonorDetailPage({ params }: { params: { orgSlug: string; donorId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const donor = await prisma.donor.findFirst({
    where: { id: params.donorId, organizationId: org.id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
  if (!donor) notFound()

  const totalDonated = donor.donations
    .filter(d => d.status === "COMPLETED")
    .reduce((sum, d) => sum + Number(d.amount), 0)

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
          <Link href={`/${params.orgSlug}/people?tab=donors`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to people
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-yellow-700">{donor.firstName[0]}{donor.lastName[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{donor.firstName} {donor.lastName}</h1>
              <p className="text-sm text-slate-500">Donor · Added {formatDate(donor.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact details</h2>
          {[
            { icon: Mail, label: donor.email, href: `mailto:${donor.email}` },
            ...(donor.phone ? [{ icon: Phone, label: donor.phone, href: `tel:${donor.phone}` }] : []),
          ].map(({ icon: Icon, label, href }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <a href={href} className="text-slate-700 hover:underline">{label}</a>
            </div>
          ))}
          {donor.notes && (
            <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-50">
              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-600 whitespace-pre-wrap">{donor.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-100">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total donated</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalDonated)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Donation history</h2>
            <span className="text-xs text-slate-400">{donor.donations.length} donations</span>
          </div>
          {donor.donations.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No donations yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {donor.donations.map(d => (
                <div key={d.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(Number(d.amount))}</p>
                    <p className="text-xs text-slate-400">{formatDate(d.createdAt)} · {d.source?.replace(/_/g, " ") ?? "Direct"}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[d.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
