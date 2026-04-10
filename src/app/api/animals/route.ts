import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { organizationId, name, species, breed, colour, sex, size, dobApprox, intakeDate,
    intakeType, microchipNumber, weight, neutered, vaccinated, description, notes } = body

  if (!organizationId || !name || !species || !intakeDate) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  // Verify membership
  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const animal = await prisma.animal.create({
    data: {
      organizationId,
      name,
      species,
      breed: breed || null,
      colour: colour || null,
      sex: sex || "UNKNOWN",
      size: size || null,
      dobApprox: dobApprox || null,
      intakeDate: new Date(intakeDate),
      intakeType: intakeType || null,
      microchipNumber: microchipNumber || null,
      weightKg: weight ? parseFloat(weight) : null,
      neutered: neutered ?? false,
      vaccinated: vaccinated ?? false,
      description: description || null,
      notes: notes || null,
      status: "INTAKE",
    },
  })

  return NextResponse.json(animal, { status: 201 })
}
