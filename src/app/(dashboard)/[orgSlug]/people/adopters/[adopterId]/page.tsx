import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { APP_STATUS_LABELS, SPECIES_EMOJI } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function AdopterDetailPage({ params }: { params: { orgSlug: string; adopterId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const adopter = await prisma.adopter.findFirst({
    where: { id: params.adopterId, organizationId: org.id },
    include: {
      adoptionApps: {
        orderBy: { createdAt: "desc" },
        include: { animal: { select: { name: true, species: true } } },
      },
    },
  })
  if (!adopter) notFound()

  const appStatusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    REVIEWING: "bg-blue-100 text-blue-700",
    APPROVED: "bg-green-100 text-green-700",
    COMPLETED: "bg-purple-100 text-purple-700",
    REJECTED: "bg-red-100 text-red-700",
    WITHDRAWN: "bg-slate-100 text-slate-600",
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/people?tab=adopters`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to people
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-green-700">{adopter.firstName[0]}{adopter.lastName[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{adopter.firstName} {adopter.lastName}</h1>
              <p className="text-sm text-slate-500">Adopter · Added {formatDate(adopter.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact details</h2>
          {[
            { icon: Mail, label: adopter.email, href: `mailto:${adopter.email}` },
            ...(adopter.phone ? [{ icon: Phone, label: adopter.phone, href: `tel:${adopter.phone}` }] : []),
            ...(adopter.address ? [{ icon: MapPin, label: adopter.address, href: undefined }] : []),
          ].map(({ icon: Icon, label, href }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              {href ? <a href={href} className="text-slate-700 hover:underline">{label}</a> : <span className="text-slate-700">{label}</span>}
            </div>
          ))}
          {adopter.notes && (
            <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-50">
              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-600 whitespace-pre-wrap">{adopter.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="font-semibold text-slate-900">Applications</h2>
            <span className="text-xs text-slate-400">{adopter.adoptionApps.length} total</span>
          </div>
          {adopter.adoptionApps.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No applications yet</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {adopter.adoptionApps.map(app => (
                <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {SPECIES_EMOJI[app.animal.species] ?? "🐾"} {app.animal.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(app.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${appStatusColors[app.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {APP_STATUS_LABELS[app.status] ?? app.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
