import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, FileText, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default async function VolunteerDetailPage({ params }: { params: { orgSlug: string; volunteerId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const volunteer = await prisma.volunteer.findFirst({
    where: { id: params.volunteerId, organizationId: org.id },
  })
  if (!volunteer) notFound()

  const skills: string[] = (() => {
    try { return JSON.parse(volunteer.skills) } catch { return [] }
  })()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/people?tab=volunteers`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to people
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-purple-700">{volunteer.firstName[0]}{volunteer.lastName[0]}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{volunteer.firstName} {volunteer.lastName}</h1>
              <p className="text-sm text-slate-500">Volunteer · Added {formatDate(volunteer.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Contact details</h2>
          {[
            { icon: Mail, label: volunteer.email, href: `mailto:${volunteer.email}` },
            ...(volunteer.phone ? [{ icon: Phone, label: volunteer.phone, href: `tel:${volunteer.phone}` }] : []),
          ].map(({ icon: Icon, label, href }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <a href={href} className="text-slate-700 hover:underline">{label}</a>
            </div>
          ))}
          {volunteer.notes && (
            <div className="flex items-start gap-3 text-sm pt-2 border-t border-slate-50">
              <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-slate-600 whitespace-pre-wrap">{volunteer.notes}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Hours logged</p>
            <div className="flex items-center gap-2 mt-2">
              <Clock className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold text-slate-900">{Number(volunteer.hoursLogged)}</span>
              <span className="text-sm text-slate-400">hrs</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Roles</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {volunteer.isHomeChecker && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Home checker</span>}
              {volunteer.isDriver && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Driver</span>}
              {!volunteer.isHomeChecker && !volunteer.isDriver && <span className="text-xs text-slate-400">No special roles</span>}
            </div>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-6">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill: string) => (
                <span key={skill} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
