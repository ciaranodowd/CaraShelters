import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { SPECIES_LABELS, STATUS_LABELS, STATUS_COLORS } from "@/lib/constants"
import { AnimalStatus, Species } from "@prisma/client"

export default async function AnimalsPage({
  params,
  searchParams,
}: {
  params: { orgSlug: string }
  searchParams: { search?: string; status?: string; species?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const where: any = { organizationId: org.id }
  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search, mode: "insensitive" } },
      { breed: { contains: searchParams.search, mode: "insensitive" } },
      { microchipNumber: { contains: searchParams.search, mode: "insensitive" } },
    ]
  }
  if (searchParams.status && searchParams.status !== "all") where.status = searchParams.status as AnimalStatus
  if (searchParams.species && searchParams.species !== "all") where.species = searchParams.species as Species

  const animals = await prisma.animal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      photos: { take: 1, orderBy: { position: "asc" } },
      _count: { select: { adoptionApps: true } },
    },
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Animals</h1>
          <p className="text-muted-foreground text-sm">{animals.length} total</p>
        </div>
        <Button asChild>
          <Link href={`/${params.orgSlug}/animals/new`}>
            <Plus className="h-4 w-4 mr-1.5" /> Add animal
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input name="search" placeholder="Search name, breed, microchip…" defaultValue={searchParams.search}
            className="pl-8" />
        </div>
        <Select name="species" defaultValue={searchParams.species ?? "all"}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {Object.entries(SPECIES_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="status" defaultValue={searchParams.status ?? "all"}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">Filter</Button>
      </form>

      {/* Grid */}
      {animals.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-3">No animals found</p>
          <Button asChild>
            <Link href={`/${params.orgSlug}/animals/new`}>Add your first animal</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {animals.map(animal => (
            <Link key={animal.id} href={`/${params.orgSlug}/animals/${animal.id}`}
              className="group rounded-xl border bg-card overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {animal.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={animal.photos[0].url} alt={animal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                    {animal.species === "DOG" ? "🐕" : animal.species === "CAT" ? "🐈" : "🐾"}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[animal.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[animal.status] ?? animal.status}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">{animal.name}</p>
                <p className="text-xs text-muted-foreground truncate">{SPECIES_LABELS[animal.species] ?? animal.species}{animal.breed ? ` · ${animal.breed}` : ""}</p>
                {animal._count.adoptionApps > 0 && (
                  <p className="text-xs text-primary font-medium mt-1">{animal._count.adoptionApps} application{animal._count.adoptionApps !== 1 ? "s" : ""}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
