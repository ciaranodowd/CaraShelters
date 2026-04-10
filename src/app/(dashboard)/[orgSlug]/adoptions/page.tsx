import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

const PIPELINE_STAGES = [
  { key: "PENDING", label: "Pending", color: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700" },
  { key: "REVIEWING", label: "Reviewing", color: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700" },
  { key: "HOME_CHECK", label: "Home check", color: "bg-purple-50 border-purple-200", badge: "bg-purple-100 text-purple-700" },
  { key: "APPROVED", label: "Approved", color: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700" },
  { key: "CONTRACT_SENT", label: "Contract sent", color: "bg-teal-50 border-teal-200", badge: "bg-teal-100 text-teal-700" },
  { key: "COMPLETED", label: "Adopted", color: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700" },
]

export const dynamic = 'force-dynamic'

export default async function AdoptionsPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const applications = await prisma.adoptionApplication.findMany({
    where: { organizationId: org.id, status: { not: "REJECTED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      animal: { select: { name: true, species: true } },
    },
    // Note: applicationType is a new field — existing records will show "Adopt" by default
  })

  const byStatus = Object.fromEntries(
    PIPELINE_STAGES.map(s => [s.key, applications.filter(a => a.status === s.key)])
  )

  return (
    <div className="p-6 max-w-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Adoptions</h1>
          <p className="text-muted-foreground text-sm">{applications.length} active applications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${params.orgSlug}/adoptions/rejected`}>Rejected</Link>
          </Button>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => (
          <div key={stage.key} className="shrink-0 w-64">
            <div className={`rounded-xl border-2 ${stage.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stage.badge}`}>
                  {byStatus[stage.key]?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(byStatus[stage.key] ?? []).map(app => (
                  <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}>
                    <div className="bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
                      <p className="font-medium text-sm">{app.applicantName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {app.animal.species === "DOG" ? "🐕" : app.animal.species === "CAT" ? "🐈" : "🐾"} {app.animal.name}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-xs text-muted-foreground">{formatDate(app.createdAt)}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          (app as any).applicationType === "FOSTER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {(app as any).applicationType === "FOSTER" ? "Foster" : "Adopt"}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {(byStatus[stage.key] ?? []).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                    Empty
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
