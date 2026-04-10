import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_BYTES = 4 * 1024 * 1024 // 4 MB

function storageUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase storage env vars not set")
  return { url, key }
}

export async function POST(req: NextRequest, { params }: { params: { animalId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const animal = await prisma.animal.findUnique({ where: { id: params.animalId } })
  if (!animal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const membership = await prisma.userOrganization.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: animal.organizationId } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Parse multipart form data
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, and WebP images are accepted" }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 4 MB" }, { status: 400 })
  }

  // Build unique storage path: animalId/timestamp-random.ext
  const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp"
  const storagePath = `${params.animalId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  // Upload to Supabase Storage
  let supabase: ReturnType<typeof storageUrl>
  try {
    supabase = storageUrl()
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  const bytes = await file.arrayBuffer()
  const uploadRes = await fetch(
    `${supabase.url}/storage/v1/object/animal-photos/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabase.key}`,
        "Content-Type": file.type,
        "x-upsert": "false",
      },
      body: Buffer.from(bytes),
    }
  )

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({})) as any
    console.error("[photo upload] Supabase Storage error:", err)
    return NextResponse.json(
      { error: err?.error || err?.message || "Storage upload failed" },
      { status: 500 }
    )
  }

  // Construct public URL
  const publicUrl = `${supabase.url}/storage/v1/object/public/animal-photos/${storagePath}`

  // If first photo, set as primary; otherwise unset any existing primary when isPrimary requested
  const count = await prisma.animalPhoto.count({ where: { animalId: params.animalId } })
  const shouldBePrimary = count === 0

  if (shouldBePrimary) {
    await prisma.animalPhoto.updateMany({
      where: { animalId: params.animalId, isPrimary: true },
      data: { isPrimary: false },
    })
  }

  const photo = await prisma.animalPhoto.create({
    data: {
      animalId: params.animalId,
      url: publicUrl,
      key: storagePath,
      isPrimary: shouldBePrimary,
      position: count,
    },
  })

  return NextResponse.json(photo, { status: 201 })
}
