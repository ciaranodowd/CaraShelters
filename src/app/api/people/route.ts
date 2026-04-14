import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { organizationId, type, firstName, lastName, email, phone, address, notes } = body

  if (!organizationId || !type || !firstName || !lastName || !email) {
    return NextResponse.json({ error: "First name, last name, and email are required" }, { status: 400 })
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const common = {
    organizationId,
    firstName,
    lastName,
    email,
    phone: phone || null,
    notes: notes || null,
  }

  if (type === "adopter") {
    const existing = await prisma.adopter.findUnique({ where: { email_organizationId: { email, organizationId } } })
    if (existing) return NextResponse.json({ error: "An adopter with this email already exists" }, { status: 409 })

    const adopter = await prisma.adopter.create({ data: { ...common, address: address || null } })
    return NextResponse.json(adopter, { status: 201 })
  }

  if (type === "donor") {
    const existing = await prisma.donor.findUnique({ where: { email_organizationId: { email, organizationId } } })
    if (existing) return NextResponse.json({ error: "A donor with this email already exists" }, { status: 409 })

    const donor = await prisma.donor.create({ data: { ...common } })
    return NextResponse.json(donor, { status: 201 })
  }

  if (type === "volunteer") {
    const existing = await prisma.volunteer.findUnique({ where: { email_organizationId: { email, organizationId } } })
    if (existing) return NextResponse.json({ error: "A volunteer with this email already exists" }, { status: 409 })

    const volunteer = await prisma.volunteer.create({ data: { ...common, skills: "[]" } })
    return NextResponse.json(volunteer, { status: 201 })
  }

  return NextResponse.json({ error: "Invalid person type" }, { status: 400 })
}
