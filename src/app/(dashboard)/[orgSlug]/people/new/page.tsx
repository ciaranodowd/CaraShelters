import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { PersonForm } from "./_components/person-form"

export const dynamic = 'force-dynamic'

export default async function NewPersonPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { type?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-2xl mx-auto">
        <PersonForm orgSlug={params.orgSlug} orgId={org.id} defaultType={searchParams.type ?? "adopter"} />
      </div>
    </div>
  )
}
