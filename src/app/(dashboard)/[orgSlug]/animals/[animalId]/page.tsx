import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, ExternalLink } from "lucide-react"
import { SPECIES_LABELS, STATUS_LABELS, SIZE_LABELS } from "@/lib/constants"
import { formatDate } from "@/lib/utils"
import { PhotoUpload } from "@/components/photo-upload"

export default async function AnimalPage({
  params,
}: {
  params: { orgSlug: string; animalId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login")

  const org = await prisma.organization.findUnique({ where: { slug: params.orgSlug }, select: { id: true } })
  if (!org) notFound()

  const animal = await prisma.animal.findFirst({
    where: { id: params.animalId, organizationId: org.id },
    include: {
      photos: { orderBy: { position: "asc" } },
      medicalRecords: { orderBy: { date: "desc" }, take: 10 },
      weightLogs: { orderBy: { date: "desc" }, take: 10 },
      fosterAssignments: {
        include: { foster: true },
        orderBy: { startDate: "desc" },
      },
      adoptionApps: {
        orderBy: { createdAt: "desc" },
        select: { id: true, applicantName: true, applicantEmail: true, status: true, createdAt: true },
      },
    },
  })
  if (!animal) notFound()

  const statusColors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800",
    IN_FOSTER: "bg-blue-100 text-blue-800",
    ADOPTED: "bg-purple-100 text-purple-800",
    MEDICAL_HOLD: "bg-red-100 text-red-800",
    QUARANTINE: "bg-yellow-100 text-yellow-800",
    INTAKE: "bg-orange-100 text-orange-800",
    DECEASED: "bg-slate-100 text-slate-500",
  }

  const mainPhoto = animal.photos[0]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/${params.orgSlug}/animals`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Animals
          </Button>
        </Link>
        {animal.publicProfile && animal.status === "AVAILABLE" && (
          <Link href={`/portal/${params.orgSlug}/animals/${animal.id}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <ExternalLink className="h-3.5 w-3.5" /> View public profile
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Main photo preview */}
        <div className="w-full sm:w-48 shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
            {mainPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainPhoto.url} alt={animal.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                <span className="text-5xl">
                  {animal.species === "DOG" ? "🐕" : animal.species === "CAT" ? "🐈" : animal.species === "RABBIT" ? "🐇" : "🐾"}
                </span>
                <span className="text-xs text-slate-400">No photo yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Header info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h1 className="text-2xl font-bold">{animal.name}</h1>
              <p className="text-muted-foreground">
                {SPECIES_LABELS[animal.species] ?? animal.species}
                {animal.breed ? ` · ${animal.breed}` : ""}
                {animal.colour ? ` · ${animal.colour}` : ""}
              </p>
            </div>
            <Link href={`/${params.orgSlug}/animals/${animal.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1.5" /> Edit
              </Button>
            </Link>
          </div>

          <span className={`inline-block text-sm px-2.5 py-1 rounded-full font-medium ${statusColors[animal.status] ?? "bg-slate-100 text-slate-600"}`}>
            {STATUS_LABELS[animal.status] ?? animal.status}
          </span>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {[
              ["Sex", animal.sex === "MALE" ? "Male" : animal.sex === "FEMALE" ? "Female" : "Unknown"],
              ["Size", animal.size ? (SIZE_LABELS[animal.size] ?? animal.size) : "—"],
              ["Neutered", animal.neutered ? "Yes" : "No"],
              ["Vaccinated", animal.vaccinated ? "Yes" : "No"],
              ["Intake date", formatDate(animal.intakeDate)],
              ["Intake type", animal.intakeType?.replace(/_/g, " ") ?? "—"],
              ["Microchip", animal.microchipNumber ?? "—"],
              ["Date of birth", animal.dobApprox ? formatDate(animal.dobApprox) : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos ({animal.photos.length})</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="foster">Foster history</TabsTrigger>
          <TabsTrigger value="applications">Applications ({animal.adoptionApps.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                animalId={animal.id}
                initialPhotos={animal.photos.map(p => ({ id: p.id, url: p.url, isPrimary: p.isPrimary }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {animal.description && (
            <Card>
              <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed">{animal.description}</p></CardContent>
            </Card>
          )}
          {animal.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Internal notes</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed whitespace-pre-wrap">{animal.notes}</p></CardContent>
            </Card>
          )}
          {!animal.description && !animal.notes && (
            <p className="text-sm text-muted-foreground py-4 text-center">No description or notes yet.</p>
          )}
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Medical records</CardTitle>
              <Link href={`/${params.orgSlug}/animals/${animal.id}/medical/new`}>
                <Button size="sm">Add record</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {animal.medicalRecords.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No medical records</p>
              ) : (
                <div className="divide-y">
                  {animal.medicalRecords.map(record => (
                    <div key={record.id} className="py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{record.type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(record.date)} {record.vetName ? `· ${record.vetName}` : ""}</p>
                        </div>
                        {record.nextDueDate && (
                          <Badge variant="outline" className="text-xs">Next: {formatDate(record.nextDueDate)}</Badge>
                        )}
                      </div>
                      {record.notes && <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foster" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Foster assignments</CardTitle>
              <Link href={`/${params.orgSlug}/animals/${animal.id}/foster/new`}>
                <Button size="sm">Assign foster</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {animal.fosterAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No foster history</p>
              ) : (
                <div className="divide-y">
                  {animal.fosterAssignments.map(a => (
                    <div key={a.id} className="py-3">
                      <p className="font-medium text-sm">{a.foster.firstName} {a.foster.lastName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.startDate)} — {a.endDate ? formatDate(a.endDate) : "Present"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adoption applications</CardTitle>
            </CardHeader>
            <CardContent>
              {animal.adoptionApps.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No applications yet</p>
              ) : (
                <div className="divide-y">
                  {animal.adoptionApps.map(app => (
                    <Link key={app.id} href={`/${params.orgSlug}/adoptions/${app.id}`}
                      className="flex items-center justify-between py-3 hover:bg-slate-50 px-2 rounded -mx-2 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{app.applicantName}</p>
                        <p className="text-xs text-muted-foreground">{app.applicantEmail} · {formatDate(app.createdAt)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{app.status.replace(/_/g, " ")}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
