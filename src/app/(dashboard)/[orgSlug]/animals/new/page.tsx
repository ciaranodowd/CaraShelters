import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { AnimalForm } from "../_components/animal-form"

export const dynamic = 'force-dynamic'

export default async function NewAnimalPage({ params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true, name: true } })
  if (!org) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add animal</h1>
        <p className="text-muted-foreground text-sm">Record a new animal intake</p>
      </div>
      <AnimalForm orgSlug={params.orgSlug} orgId={org.id} />
    </div>
  )
}
