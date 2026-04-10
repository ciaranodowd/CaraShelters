import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { AnimalForm } from "../../_components/animal-form"

export default async function EditAnimalPage({ params }: { params: { orgSlug: string; animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const animal = await prisma.animal.findFirst({
    where: { id: params.animalId, organizationId: org.id },
  })
  if (!animal) notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit {animal.name}</h1>
      </div>
      <AnimalForm orgSlug={params.orgSlug} orgId={org.id} animal={animal} />
    </div>
  )
}
