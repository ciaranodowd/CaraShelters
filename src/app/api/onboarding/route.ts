import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, email, phone, address, city, county, country, website, chyNumber, description } = await req.json()
  if (!name || !email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 })

  // Generate unique slug
  let baseSlug = slugify(name)
  let slug = baseSlug
  let suffix = 1
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix++}`
  }

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      email,
      phone: phone || null,
      address: address || null,
      city: city || null,
      county: county || null,
      country: country || "IE",
      website: website || null,
      chyNumber: chyNumber || null,
      description: description || null,
      users: {
        create: {
          userId: session.user.id,
          role: "ADMIN",
        },
      },
    },
  })

  return NextResponse.json({ slug: org.slug }, { status: 201 })
}
