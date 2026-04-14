import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { organizationId, amount, donorName, donorEmail, paymentMethod, notes, donationDate } = body

  if (!organizationId || !amount) {
    return NextResponse.json({ error: "Amount is required" }, { status: 400 })
  }
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 })
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const donation = await prisma.donation.create({
    data: {
      organizationId,
      amount: parseFloat(amount),
      currency: "EUR",
      donorName: donorName || null,
      donorEmail: donorEmail || null,
      source: paymentMethod || "direct",
      notes: notes || null,
      status: "COMPLETED",
      type: "ONE_OFF",
      createdAt: donationDate ? new Date(donationDate) : new Date(),
    },
  })

  return NextResponse.json(donation, { status: 201 })
}
