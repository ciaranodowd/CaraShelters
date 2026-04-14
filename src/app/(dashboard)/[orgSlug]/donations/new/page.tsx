import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { DonationForm } from "./_components/donation-form"

export const dynamic = 'force-dynamic'

export default async function NewDonationPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-2xl mx-auto">
        <DonationForm orgSlug={params.orgSlug} orgId={org.id} />
      </div>
    </div>
  )
}
