import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const app = await prisma.adoptionApplication.findUnique({
    where: { id: params.appId },
    include: { animal: { select: { name: true, species: true } } },
  })
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: app.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  return NextResponse.json(app)
}

export async function PATCH(req: NextRequest, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const app = await prisma.adoptionApplication.findUnique({ where: { id: params.appId } })
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: app.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { status, internalNotes, homeCheckDate, homeCheckNotes, homeCheckPassed } = await req.json()

  const updated = await prisma.adoptionApplication.update({
    where: { id: params.appId },
    data: {
      status: status ?? app.status,
      internalNotes: internalNotes !== undefined ? internalNotes : app.internalNotes,
      homeCheckDate: homeCheckDate !== undefined ? (homeCheckDate ? new Date(homeCheckDate) : null) : app.homeCheckDate,
      homeCheckNotes: homeCheckNotes !== undefined ? homeCheckNotes : app.homeCheckNotes,
      homeCheckPassed: homeCheckPassed !== undefined ? homeCheckPassed : app.homeCheckPassed,
    },
  })

  return NextResponse.json(updated)
}
