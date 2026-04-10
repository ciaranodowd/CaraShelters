import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } })
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
  })
  if (!membership || membership.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, email, phone, address, city, county, country, website, chyNumber, description } = await req.json()

  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      name: name ?? org.name,
      email: email !== undefined ? email : org.email,
      phone: phone !== undefined ? (phone || null) : org.phone,
      address: address !== undefined ? (address || null) : org.address,
      city: city !== undefined ? (city || null) : org.city,
      county: county !== undefined ? (county || null) : org.county,
      country: country ?? org.country,
      website: website !== undefined ? (website || null) : org.website,
      chyNumber: chyNumber !== undefined ? (chyNumber || null) : org.chyNumber,
      description: description !== undefined ? (description || null) : org.description,
    },
  })

  return NextResponse.json(updated)
}
