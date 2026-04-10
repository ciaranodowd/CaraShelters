import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { name, email: email.toLowerCase(), password: hashed },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: unknown) {
    const isDev = process.env.NODE_ENV === "development"
    const message = err instanceof Error ? err.message : String(err)
    console.error("[register] error:", message)
    return NextResponse.json(
      {
        error: "Registration failed",
        ...(isDev && { detail: message }),
      },
      { status: 500 }
    )
  }
}
