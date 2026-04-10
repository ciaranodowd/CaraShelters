import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { SPECIES_LABELS, SPECIES_EMOJI, SIZE_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { Heart, MapPin, Calendar, Ruler, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { orgSlug: string; animalId: string }
}) {
  const animal = await prisma.animal.findFirst({
    where: { id: params.animalId, status: "AVAILABLE" },
    select: { name: true, species: true, breed: true },
  })
  if (!animal) return { title: "Animal not found" }
  const label = SPECIES_LABELS[animal.species] ?? animal.species
  return {
    title: `${animal.name} — ${label}${animal.breed ? ` (${animal.breed})` : ""}`,
    description: `Meet ${animal.name}, looking for a loving home.`,
  }
}

export default async function PublicAnimalProfilePage({
  params,
}: {
  params: { orgSlug: string; animalId: string }
}) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.orgSlug },
    select: { id: true, name: true, email: true, phone: true, logo: true, city: true, county: true },
  })
  if (!org) notFound()

  const animalResult = await prisma.animal.findFirst({
    where: { id: params.animalId, organizationId: org!.id, status: "AVAILABLE" },
    include: { photos: { orderBy: { position: "asc" } } },
  })
  if (!animalResult) notFound()

  // Non-null assertions — both are guaranteed by notFound() guards above
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const o = org!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const animal = animalResult!

  const mainPhoto = animal.photos.find(p => p.isPrimary) ?? animal.photos[0]
  const emoji = SPECIES_EMOJI[animal.species] ?? "🐾"

  function ageLabel(): string | null {
    if (animal.dobApprox) {
      const months = Math.floor(
        (Date.now() - new Date(animal.dobApprox).getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
      if (months < 12) return `${months} month${months !== 1 ? "s" : ""} old`
      const years = Math.floor(months / 12)
      const rem = months % 12
      return rem > 0 ? `${years} yr ${rem} mo` : `${years} year${years !== 1 ? "s" : ""} old`
    }
    if (animal.ageYears !== null && animal.ageYears !== undefined) {
      const m = animal.ageMonths ?? 0
      return animal.ageYears === 0
        ? `${m} month${m !== 1 ? "s" : ""} old`
        : m > 0
        ? `${animal.ageYears} yr ${m} mo`
        : `${animal.ageYears} year${animal.ageYears !== 1 ? "s" : ""} old`
    }
    return null
  }

  const age = ageLabel()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href={`/portal/${params.orgSlug}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to {o.name}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="flex items-center gap-2 ml-auto">
            {o.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={o.logo} alt={o.name} className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                {o.name[0]}
              </div>
            )}
            <span className="font-semibold text-sm">{o.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Photo */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
              {mainPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainPhoto.url}
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                  <span className="text-8xl">{emoji}</span>
                  <span className="text-sm text-slate-400 font-medium">Photo coming soon</span>
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {animal.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {animal.photos.map(photo => (
                  <div
                    key={photo.id}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      photo.isPrimary ? "border-primary" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-sm text-primary font-medium mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Available for adoption
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{animal.name}</h1>
              <p className="text-lg text-muted-foreground mt-1">
                {SPECIES_LABELS[animal.species] ?? animal.species}
                {animal.breed ? ` · ${animal.breed}` : ""}
                {animal.colour ? ` · ${animal.colour}` : ""}
              </p>
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 gap-3">
              {age && (
                <div className="flex items-center gap-2.5 p-3 bg-secondary/50 rounded-xl">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-semibold">{age}{animal.ageEstimated ? " (approx)" : ""}</p>
                  </div>
                </div>
              )}

              {animal.sex !== "UNKNOWN" && (
                <div className="flex items-center gap-2.5 p-3 bg-secondary/50 rounded-xl">
                  <span className="text-lg shrink-0">{animal.sex === "MALE" ? "♂" : "♀"}</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Sex</p>
                    <p className="text-sm font-semibold capitalize">{animal.sex.toLowerCase()}</p>
                  </div>
                </div>
              )}

              {animal.size && (
                <div className="flex items-center gap-2.5 p-3 bg-secondary/50 rounded-xl">
                  <Ruler className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-semibold">{SIZE_LABELS[animal.size] ?? animal.size}</p>
                  </div>
                </div>
              )}

              {animal.intakeType && (
                <div className="flex items-center gap-2.5 p-3 bg-secondary/50 rounded-xl">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Came to us</p>
                    <p className="text-sm font-semibold capitalize">
                      {animal.intakeType.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Health badges */}
            <div className="flex flex-wrap gap-2">
              <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                animal.neutered ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
              }`}>
                {animal.neutered
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <XCircle className="h-3.5 w-3.5" />}
                {animal.neutered ? "Neutered / spayed" : "Not yet neutered"}
              </div>
              <div className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                animal.vaccinated ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
              }`}>
                {animal.vaccinated
                  ? <CheckCircle className="h-3.5 w-3.5" />
                  : <XCircle className="h-3.5 w-3.5" />}
                {animal.vaccinated ? "Vaccinated" : "Not yet vaccinated"}
              </div>
              {animal.microchipNumber && (
                <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium bg-green-50 text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Microchipped
                </div>
              )}
            </div>

            {/* Intake date */}
            {animal.intakeDate && (
              <p className="text-xs text-muted-foreground">
                In our care since {formatDate(animal.intakeDate)}
              </p>
            )}

            {/* CTA */}
            <Link
              href={`/portal/${params.orgSlug}/adopt/${animal.id}`}
              className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 px-6 rounded-xl transition-colors text-base shadow-sm"
            >
              <Heart className="h-4 w-4" />
              Apply to adopt or foster {animal.name}
            </Link>
          </div>
        </div>

        {/* Description */}
        {animal.description && (
          <section className="bg-white rounded-2xl border p-6">
            <h2 className="text-lg font-bold mb-3">About {animal.name}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{animal.description}</p>
          </section>
        )}

        {/* What happens next */}
        <section className="bg-secondary/40 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">What happens when I apply?</h2>
          <ol className="space-y-3">
            {[
              "Fill in the short application form — it takes about 5 minutes.",
              `${o.name} will review your application and be in touch within a few days.`,
              "If you're a good match, you'll be invited for a meet-and-greet or home visit.",
              `If all goes well, ${animal.name} comes home with you!`,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Contact */}
        {(o.email || o.phone) && (
          <section className="border rounded-2xl p-6 text-center">
            <p className="text-sm font-medium mb-1">Questions about {animal.name}?</p>
            <p className="text-sm text-muted-foreground mb-3">
              Get in touch with {o.name} directly.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {o.email && (
                <a
                  href={`mailto:${o.email}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {o.email}
                </a>
              )}
              {o.phone && (
                <a
                  href={`tel:${o.phone}`}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  {o.phone}
                </a>
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t mt-12 py-6 text-center text-xs text-muted-foreground">
        <Link href={`/portal/${params.orgSlug}`} className="hover:underline">{o.name}</Link>
        {" · "}Powered by Cara
      </footer>
    </div>
  )
}
