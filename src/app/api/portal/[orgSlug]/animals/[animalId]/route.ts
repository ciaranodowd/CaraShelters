import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { orgSlug: string; animalId: string } }
) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true, name: true, email: true },
  })
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const animal = await prisma.animal.findFirst({
    where: { id: params.animalId, organizationId: org.id, status: "AVAILABLE" },
    include: { photos: { take: 3, orderBy: { position: "asc" } } },
  })
  if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ animal, org })
}
