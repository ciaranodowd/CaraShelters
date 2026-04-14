import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getAppAndVerify(appId: string, userId: string) {
  const app = await prisma.adoptionApplication.findUnique({
    where: { id: appId },
    include: { contract: true },
  })
  if (!app) return null

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId, organizationId: app.organizationId } },
  })
  if (!membership) return null

  return app
}

export async function POST(req: NextRequest, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const app = await getAppAndVerify(params.appId, session.user.id)
  if (!app) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 })
  if (app.contract) return NextResponse.json({ error: "Contract already exists" }, { status: 409 })

  const { adoptionFee, contractText } = await req.json()
  if (!contractText?.trim()) return NextResponse.json({ error: "Contract text is required" }, { status: 400 })

  // Ensure adopter profile exists — create one from application data if needed
  let adopterId = app.adopterId
  if (!adopterId) {
    const nameParts = app.applicantName.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || "-"

    // Try to find existing adopter by email
    let adopter = await prisma.adopter.findUnique({
      where: { email_organizationId: { email: app.applicantEmail, organizationId: app.organizationId } },
    })
    if (!adopter) {
      adopter = await prisma.adopter.create({
        data: {
          organizationId: app.organizationId,
          firstName,
          lastName,
          email: app.applicantEmail,
          phone: app.applicantPhone ?? null,
          address: app.applicantAddress ?? null,
        },
      })
    }
    adopterId = adopter.id

    // Link adopter to application
    await prisma.adoptionApplication.update({
      where: { id: params.appId },
      data: { adopterId },
    })
  }

  const contract = await prisma.adoptionContract.create({
    data: {
      organizationId: app.organizationId,
      animalId: app.animalId,
      adopterId,
      applicationId: params.appId,
      contractText,
      adoptionFee: adoptionFee ?? null,
      currency: "EUR",
    },
  })

  return NextResponse.json(contract, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { appId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const app = await getAppAndVerify(params.appId, session.user.id)
  if (!app) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 })
  if (!app.contract) return NextResponse.json({ error: "No contract found" }, { status: 404 })

  const { adoptionFee, contractText } = await req.json()

  const contract = await prisma.adoptionContract.update({
    where: { applicationId: params.appId },
    data: {
      contractText: contractText ?? app.contract.contractText,
      adoptionFee: adoptionFee !== undefined ? adoptionFee : app.contract.adoptionFee,
    },
  })

  return NextResponse.json(contract)
}
