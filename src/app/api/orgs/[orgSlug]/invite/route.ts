import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: { orgSlug: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug } })
  if (!org) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: org.id } },
  })
  if (!membership || membership.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { email, role } = await req.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  // Find existing user
  let user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    // Already in org?
    const existing = await prisma.userOrganization.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    })
    if (existing) return NextResponse.json({ error: "This person is already a member" }, { status: 400 })

    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: role ?? "STAFF" },
    })
  } else {
    // TODO: send invite email via Resend
    // For now, create a placeholder user
    user = await prisma.user.create({ data: { email } })
    await prisma.userOrganization.create({
      data: { userId: user.id, organizationId: org.id, role: role ?? "STAFF" },
    })
  }

  return NextResponse.json({ success: true })
}
