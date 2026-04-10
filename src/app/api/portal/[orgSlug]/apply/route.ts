import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { orgSlug: string } }
) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true },
  })
  if (!org) return NextResponse.json({ error: "Organisation not found" }, { status: 404 })

  const body = await req.json()
  const {
    animalId, applicantName, applicantEmail, applicantPhone, applicantAddress, applicantCounty,
    householdType, rentOrOwn, landlordPermission,
    hasGarden, gardenFenced, hasChildren, childrenAges,
    hasOtherPets, otherPetsDetails, experienceLevel, previousPets,
    whyAdopt, workingHours, applicationType, gdprConsent,
  } = body

  if (!animalId || !applicantName || !applicantEmail || !whyAdopt) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 })
  }

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, organizationId: org.id, status: "AVAILABLE" },
  })
  if (!animal) return NextResponse.json({ error: "Animal not available" }, { status: 400 })

  const application = await (prisma.adoptionApplication.create as any)({
    data: {
      organizationId: org.id,
      animalId,
      applicantName,
      applicantEmail,
      applicantPhone: applicantPhone || null,
      applicantAddress: applicantAddress || null,
      applicantCounty: applicantCounty || null,
      householdType: householdType || null,
      rentOrOwn: rentOrOwn || null,
      landlordPermission: landlordPermission ?? null,
      hasGarden: hasGarden ?? false,
      gardenFenced: gardenFenced ?? null,
      hasChildren: hasChildren ?? false,
      childrenAges: childrenAges || null,
      hasOtherPets: hasOtherPets ?? false,
      otherPetsDetails: otherPetsDetails || null,
      experienceLevel: experienceLevel || null,
      previousPets: previousPets || null,
      whyAdopt: whyAdopt || null,
      workingHours: workingHours || null,
      applicationType: applicationType || "ADOPT",
      gdprConsent: gdprConsent ?? false,
      gdprConsentAt: gdprConsent ? new Date() : null,
      status: "PENDING",
    },
  })

  return NextResponse.json({ id: application.id }, { status: 201 })
}
