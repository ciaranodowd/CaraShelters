import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { MedicalRecordForm } from "./_components/medical-record-form"

export const dynamic = 'force-dynamic'

export default async function NewMedicalRecordPage({ params }: { params: { orgSlug: string; animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const animal = await prisma.animal.findFirst({
    where: { id: params.animalId, organizationId: org.id },
    select: { id: true, name: true },
  })
  if (!animal) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-2xl mx-auto">
        <MedicalRecordForm orgSlug={params.orgSlug} animalId={animal.id} animalName={animal.name} />
      </div>
    </div>
  )
}
