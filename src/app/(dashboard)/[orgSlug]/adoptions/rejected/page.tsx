import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, XCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { SPECIES_EMOJI } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export default async function RejectedApplicationsPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const applications = await prisma.adoptionApplication.findMany({
    where: { organizationId: org.id, status: { in: ["REJECTED", "WITHDRAWN"] } },
    orderBy: { updatedAt: "desc" },
    include: { animal: { select: { name: true, species: true } } },
  })

  const rejected = applications.filter(a => a.status === "REJECTED")
  const withdrawn = applications.filter(a => a.status === "WITHDRAWN")

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/adoptions`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to adoptions
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Rejected &amp; withdrawn</h1>
          <p className="text-sm text-slate-500 mt-0.5">{applications.length} total</p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
            <XCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No rejected applications</p>
            <p className="text-sm text-slate-400 mt-1">Applications you reject will appear here</p>
          </div>
        ) : (
          <>
            {rejected.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Rejected ({rejected.length})</h2>
                <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                  {rejected.map(app => (
                    <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                          <XCircle className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.applicantName}</p>
                          <p className="text-xs text-slate-400">
                            {SPECIES_EMOJI[app.animal.species] ?? "🐾"} {app.animal.name} · {formatDate(app.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-red-100 text-red-700">Rejected</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {withdrawn.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Withdrawn ({withdrawn.length})</h2>
                <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">
                  {withdrawn.map(app => (
                    <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-500">W</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.applicantName}</p>
                          <p className="text-xs text-slate-400">
                            {SPECIES_EMOJI[app.animal.species] ?? "🐾"} {app.animal.name} · {formatDate(app.updatedAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">Withdrawn</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
