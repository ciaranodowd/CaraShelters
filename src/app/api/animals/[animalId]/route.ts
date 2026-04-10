import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const animal = await prisma.animal.findUnique({ where: { id: params.animalId } })
  if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, species, breed, colour, sex, size, dobApprox, intakeDate, intakeType,
    microchipNumber, weight, neutered, vaccinated, description, notes, status, publicProfile } = body

  const updated = await prisma.animal.update({
    where: { id: params.animalId },
    data: {
      name: name ?? animal.name,
      species: species ?? animal.species,
      breed: breed !== undefined ? (breed || null) : animal.breed,
      colour: colour !== undefined ? (colour || null) : animal.colour,
      sex: sex ?? animal.sex,
      size: size !== undefined ? (size || null) : animal.size,
      dobApprox: dobApprox !== undefined ? (dobApprox ? new Date(dobApprox) : null) : animal.dobApprox,
      intakeDate: intakeDate ? new Date(intakeDate) : animal.intakeDate,
      intakeType: intakeType !== undefined ? (intakeType || null) : animal.intakeType,
      microchipNumber: microchipNumber !== undefined ? (microchipNumber || null) : animal.microchipNumber,
      weightKg: weight !== undefined ? (weight ? parseFloat(weight) : null) : animal.weightKg,
      neutered: neutered !== undefined ? neutered : animal.neutered,
      vaccinated: vaccinated !== undefined ? vaccinated : animal.vaccinated,
      description: description !== undefined ? (description || null) : animal.description,
      notes: notes !== undefined ? (notes || null) : animal.notes,
      status: status ?? animal.status,
      publicProfile: publicProfile !== undefined ? publicProfile : animal.publicProfile,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const animal = await prisma.animal.findUnique({ where: { id: params.animalId } })
  if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: animal.organizationId } },
  })
  if (!membership || membership.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.animal.delete({ where: { id: params.animalId } })
  return NextResponse.json({ success: true })
}
