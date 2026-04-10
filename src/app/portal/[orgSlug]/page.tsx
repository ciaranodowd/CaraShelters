import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { SPECIES_LABELS } from "@/lib/constants"

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { orgSlug: string } }) {
  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { name: true } })
  return { title: org ? `${org.name} — Adopt` : "Adopt" }
}

export default async function PublicPortalPage({ params }: { params: { orgSlug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true, name: true, description: true, email: true, phone: true, website: true, city: true, county: true, logo: true },
  })
  if (!org) notFound()

  const animals = await prisma.animal.findMany({
    where: { organizationId: org.id, status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1, orderBy: { position: "asc" } } },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {org.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logo} alt={org.name} className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {org.name[0]}
              </div>
            )}
            <span className="font-bold">{org.name}</span>
          </div>
          <div className="flex gap-3 text-sm text-muted-foreground">
            {org.city && <span>{org.city}{org.county ? `, ${org.county}` : ""}</span>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* About */}
        {org.description && (
          <div className="mb-8 text-center max-w-2xl mx-auto">
            <p className="text-muted-foreground">{org.description}</p>
          </div>
        )}

        <h2 className="text-2xl font-bold mb-6">
          Animals looking for homes
          <Badge variant="secondary" className="ml-3">{animals.length}</Badge>
        </h2>

        {animals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No animals available for adoption right now.</p>
            {org.email && (
              <p className="text-sm mt-2">
                <a href={`mailto:${org.email}`} className="text-primary hover:underline">Contact us</a> to find out more.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {animals.map(animal => (
              <Link key={animal.id} href={`/portal/${params.orgSlug}/animals/${animal.id}`}
                className="group rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-slate-100 overflow-hidden relative">
                  {animal.photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={animal.photos[0].url} alt={animal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {animal.species === "DOG" ? "🐕" : animal.species === "CAT" ? "🐈" : "🐾"}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold">{animal.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {SPECIES_LABELS[animal.species] ?? animal.species}
                    {animal.breed ? ` · ${animal.breed}` : ""}
                  </p>
                  {animal.sex !== "UNKNOWN" && (
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{animal.sex.toLowerCase()}{animal.isNeutered ? " · neutered" : ""}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        <p>{org.name} · Powered by Cara</p>
        {org.email && <p className="mt-1"><a href={`mailto:${org.email}`} className="hover:underline">{org.email}</a></p>}
      </footer>
    </div>
  )
}
