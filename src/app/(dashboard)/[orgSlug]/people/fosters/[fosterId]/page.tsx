import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, MapPin, FileText, CheckCircle, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SPECIES_EMOJI, SPECIES_LABELS } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function FosterDetailPage({ params }: { params: { orgSlug: string; fosterId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const foster = await prisma.foster.findFirst({
    where: { id: params.fosterId, organizationId: org.id },
    include: {
      assignments: {
        orderBy: { startDate: "desc" },
        include: { animal: { select: { id: true, name: true, species: true } } },
      },
    },
  })
  if (!foster) notFound()

  const active = foster.assignments.filter(a => !a.endDate)
  const past = foster.assignments.filter(a => !!a.endDate)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/people?tab=fosters`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to people
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-blue-700">{foster.firstName[0]}{foster.lastName[0]}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{foster.firstName} {foster.lastName}</h1>
                {foster.approved
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Approved</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending approval</span>
                }
              </div>
              <p className="text-sm text-slate-500">Foster · Added {formatDate(foster.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact details</h2>
          {[
            { icon: Mail, label: foster.email, href: `mailto:${foster.email}` },
            ...(foster.phone ? [{ icon: Phone, label: foster.phone, href: `tel:${foster.phone}` }] : []),
            ...(foster.address ? [{ icon: MapPin, label: foster.address, href: undefined }] : []),
          ].map(({ icon: Icon, label, href }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              {href ? <a href={href} className="text-slate-700 hover:underline">{label}</a> : <span className="text-slate-700">{label}</span>}
            </div>
          ))}
          {foster.notes && (
            <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-50">
              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-600 whitespace-pre-wrap">{foster.notes}</p>
            </div>
          )}
        </div>

        {active.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-50">
              <Clock className="h-4 w-4 text-green-500" />
              <h2 className="font-semibold text-slate-900">Currently fostering ({active.length})</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {active.map(a => (
                <Link key={a.id} href={`/${params.orgSlug}/animals/${a.animal.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{SPECIES_EMOJI[a.animal.species] ?? "🐾"} {a.animal.name}</p>
                    <p className="text-xs text-slate-400">Since {formatDate(a.startDate)}</p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">Active</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-50">
            <CheckCircle className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Past fosters ({past.length})</h2>
          </div>
          {past.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No past foster history</div>
          ) : (
            <div className="divide-y divide-slate-50">
              {past.map(a => (
                <Link key={a.id} href={`/${params.orgSlug}/animals/${a.animal.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{SPECIES_EMOJI[a.animal.species] ?? "🐾"} {a.animal.name}</p>
                    <p className="text-xs text-slate-400">{formatDate(a.startDate)} – {a.endDate ? formatDate(a.endDate) : ""}</p>
                  </div>
                  <span className="text-xs text-slate-400">{SPECIES_LABELS[a.animal.species]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
