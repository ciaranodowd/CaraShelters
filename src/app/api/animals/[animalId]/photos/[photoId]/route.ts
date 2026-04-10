import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function storageDelete(key: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return // silently skip if not configured

  // Supabase Storage: DELETE /storage/v1/object/{bucket}/{path}
  await fetch(`${supabaseUrl}/storage/v1/object/animal-photos/${key}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${serviceKey}` },
  }).catch(err => {
    // Log but don't fail the request — DB record deletion still succeeds
    console.error("[photo delete] Storage removal error:", err)
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { animalId: string; photoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const photo = await prisma.animalPhoto.findUnique({
    where: { id: params.photoId },
    include: { animal: { select: { organizationId: true } } },
  })
  if (!photo || photo.animalId !== params.animalId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: photo.animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Delete DB record first, then remove from storage
  await prisma.animalPhoto.delete({ where: { id: params.photoId } })
  await storageDelete(photo.key)

  // Promote next photo to primary if this was primary
  if (photo.isPrimary) {
    const next = await prisma.animalPhoto.findFirst({
      where: { animalId: params.animalId },
      orderBy: { position: "asc" },
    })
    if (next) {
      await prisma.animalPhoto.update({ where: { id: next.id }, data: { isPrimary: true } })
    }
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { animalId: string; photoId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const photo = await prisma.animalPhoto.findUnique({
    where: { id: params.photoId },
    include: { animal: { select: { organizationId: true } } },
  })
  if (!photo || photo.animalId !== params.animalId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: photo.animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Set as primary: unset all others first, then set this one
  await prisma.animalPhoto.updateMany({
    where: { animalId: params.animalId, isPrimary: true },
    data: { isPrimary: false },
  })
  const updated = await prisma.animalPhoto.update({
    where: { id: params.photoId },
    data: { isPrimary: true },
  })

  return NextResponse.json(updated)
}
