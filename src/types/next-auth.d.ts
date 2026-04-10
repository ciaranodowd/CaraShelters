import "next-auth"
import { OrgRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      organizations?: {
        id: string
        name: string
        slug: string
        role: OrgRole
      }[]
    }
  }
}
