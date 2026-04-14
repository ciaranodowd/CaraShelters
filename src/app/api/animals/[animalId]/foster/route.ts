import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { fosterId, startDate, endDate, notes } = body

  if (!fosterId || !startDate) {
    return NextResponse.json({ error: "Foster and start date are required" }, { status: 400 })
  }

  const animal = await prisma.animal.findUnique({
    where: { id: params.animalId },
    select: { organizationId: true },
  })
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const assignment = await prisma.fosterAssignment.create({
    data: {
      organizationId: animal.organizationId,
      animalId: params.animalId,
      fosterId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes: notes || null,
    },
  })

  // Update animal status to FOSTERED
  await prisma.animal.update({
    where: { id: params.animalId },
    data: { status: "FOSTERED" },
  })

  return NextResponse.json(assignment, { status: 201 })
}
