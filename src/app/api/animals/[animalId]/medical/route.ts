import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { type, description, date, vetName, vetClinic, cost, notes, nextDueDate } = body

  if (!type || !description || !date) {
    return NextResponse.json({ error: "Type, description, and date are required" }, { status: 400 })
  }

  // Verify the animal belongs to an org the user is a member of
  const animal = await prisma.animal.findUnique({
    where: { id: params.animalId },
    select: { organizationId: true },
  })
  if (!animal) return NextResponse.json({ error: "Animal not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const record = await prisma.medicalRecord.create({
    data: {
      animalId: params.animalId,
      type,
      description,
      date: new Date(date),
      vetName: vetName || null,
      vetClinic: vetClinic || null,
      cost: cost ? parseFloat(cost) : null,
      notes: notes || null,
      nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
    },
  })

  return NextResponse.json(record, { status: 201 })
}
