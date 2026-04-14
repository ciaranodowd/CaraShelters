import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  PawPrint, Users, Heart, DollarSign,
  TrendingUp, Plus, UserPlus, Banknote, Globe,
  ArrowRight,
} from "lucide-react"

export const dynamic = 'force-dynamic'

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function initials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

function formatAge(ageYears?: number | null, ageMonths?: number | null): string {
  if (ageYears == null && ageMonths == null) return "Age unknown"
  if (ageYears && ageYears > 0) return `${ageYears}y${ageMonths ? ` ${ageMonths}m` : ""}`
  if (ageMonths) return `${ageMonths}mo`
  return "< 1 mo"
}

export default async function DashboardPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true, name: true } })
  if (!org) notFound()

  const [
    totalAnimals,
    availableAnimals,
    inFosterAnimals,
    pendingApps,
    ,
    monthDonations,
    recentAnimals,
    recentApps,
  ] = await Promise.all([
    prisma.animal.count({ where: { organizationId: org.id } }),
    prisma.animal.count({ where: { organizationId: org.id, status: "AVAILABLE" } }),
    prisma.animal.count({ where: { organizationId: org.id, status: "FOSTERED" } }),
    prisma.adoptionApplication.count({ where: { organizationId: org.id, status: "PENDING" } }),
    prisma.adopter.count({ where: { organizationId: org.id } }),
    prisma.donation.aggregate({
      where: {
        organizationId: org.id,
        status: "COMPLETED",
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
      _sum: { amount: true },
    }),
    prisma.animal.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, species: true, status: true, breed: true, ageYears: true, ageMonths: true },
    }),
    prisma.adoptionApplication.findMany({
      where: { organizationId: org.id, status: { in: ["PENDING", "HOME_CHECK_SCHEDULED"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { animal: { select: { name: true } } },
    }),
  ])

  const stats = [
    {
      label: "Total Animals",
      value: totalAnimals,
      sub: `${availableAnimals} available`,
      icon: PawPrint,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      href: `/${params.orgSlug}/animals`,
    },
    {
      label: "In Foster",
      value: inFosterAnimals,
      sub: "currently fostered",
      icon: Heart,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      href: `/${params.orgSlug}/animals?status=IN_FOSTER`,
    },
    {
      label: "Pending Applications",
      value: pendingApps,
      sub: "awaiting review",
      icon: Users,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      href: `/${params.orgSlug}/adoptions`,
    },
    {
      label: "Donations This Month",
      value: formatCurrency(Number(monthDonations._sum.amount ?? 0)),
      sub: "completed donations",
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      href: `/${params.orgSlug}/donations`,
    },
  ]

  const statusConfig: Record<string, { label: string; cls: string }> = {
    AVAILABLE:    { label: "Available",    cls: "bg-green-100 text-green-700" },
    FOSTERED:     { label: "Foster",       cls: "bg-blue-100 text-blue-700" },
    ADOPTED:      { label: "Adopted",      cls: "bg-purple-100 text-purple-700" },
    INTAKE:       { label: "Intake",       cls: "bg-amber-100 text-amber-700" },
    MEDICAL_HOLD: { label: "Medical Hold", cls: "bg-red-100 text-red-700" },
    QUARANTINE:   { label: "Quarantine",   cls: "bg-orange-100 text-orange-700" },
    DECEASED:     { label: "Deceased",     cls: "bg-slate-100 text-slate-500" },
  }

  const quickActions = [
    {
      label: "Add Animal",
      sub: "Register a new intake",
      icon: Plus,
      iconBg: "bg-green-100",
      iconColor: "text-green-700",
      href: `/${params.orgSlug}/animals/new`,
    },
    {
      label: "Add Person",
      sub: "New adopter or contact",
      icon: UserPlus,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-700",
      href: `/${params.orgSlug}/people/new`,
    },
    {
      label: "Record Donation",
      sub: "Log a new donation",
      icon: Banknote,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-700",
      href: `/${params.orgSlug}/donations/new`,
    },
    {
      label: "Public Portal",
      sub: "View your public page",
      icon: Globe,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-700",
      href: `/${params.orgSlug}/portal`,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Dashboard overview</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(stat => (
            <Link key={stat.label} href={stat.href}>
              <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-slate-200 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Main content row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Animals */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Recent Animals</h2>
              <Link href={`/${params.orgSlug}/animals`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentAnimals.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <PawPrint className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No animals yet —{" "}
                    <Link href={`/${params.orgSlug}/animals/new`} className="text-green-600 hover:underline">add your first</Link>
                  </p>
                </div>
              ) : (
                recentAnimals.map(animal => {
                  const cfg = statusConfig[animal.status] ?? { label: animal.status.replace(/_/g, " "), cls: "bg-slate-100 text-slate-600" }
                  return (
                    <Link key={animal.id} href={`/${params.orgSlug}/animals/${animal.id}`}
                      className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{animal.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {animal.breed ?? animal.species} · {formatAge(animal.ageYears, animal.ageMonths)}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </Link>
                  )
                })
              )}
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900">Applications Needing Action</h2>
              <Link href={`/${params.orgSlug}/adoptions`} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentApps.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <TrendingUp className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No pending applications</p>
                </div>
              ) : (
                recentApps.map(app => (
                  <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-slate-600">{initials(app.applicantName)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{app.applicantName}</p>
                      <p className="text-xs text-slate-400 truncate">For {app.animal.name}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{timeAgo(app.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-xl border border-slate-100 hover:border-slate-200 p-5 flex items-center gap-4 transition-colors cursor-pointer">
                  <div className={`p-2.5 rounded-lg shrink-0 ${action.iconBg}`}>
                    <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{action.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
