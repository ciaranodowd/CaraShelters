"use client"
import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "HOME_CHECK", label: "Home check" },
  { value: "APPROVED", label: "Approved" },
  { value: "CONTRACT_SENT", label: "Contract sent" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
]

export default function ApplicationPage() {
  const params = useParams()
  const router = useRouter()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    fetch(`/api/applications/${params.appId}`)
      .then(r => r.json())
      .then(data => {
        setApp(data)
        setNotes(data.internalNotes ?? "")
        setStatus(data.status)
        setLoading(false)
      })
  }, [params.appId])

  async function saveStatus() {
    setSaving(true)
    await fetch(`/api/applications/${params.appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, internalNotes: notes }),
    })
    setSaving(false)
    router.refresh()
  }

  if (loading) return <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
  if (!app) return <div className="p-6">Application not found</div>

  const fields = [
    ["Applicant", app.applicantName],
    ["Email", app.applicantEmail],
    ["Phone", app.applicantPhone ?? "—"],
    ["Address", app.applicantAddress ?? "—"],
    ["County", app.applicantCounty ?? "—"],
    ["Home type", app.householdType ?? "—"],
    ["Rent or own", app.rentOrOwn ?? "—"],
    ["Landlord permission", app.rentOrOwn === "rent" ? (app.landlordPermission ? "Yes" : "No / not stated") : "N/A"],
    ["Has garden", app.hasGarden ? "Yes" : "No"],
    ["Garden fenced", app.gardenFenced != null ? (app.gardenFenced ? "Yes" : "No") : "—"],
    ["Has children", app.hasChildren ? "Yes" : "No"],
    ["Children's ages", app.childrenAges ?? "—"],
    ["Has other pets", app.hasOtherPets ? "Yes" : "No"],
    ["Other pets", app.otherPetsDetails ?? "—"],
    ["Experience level", app.experienceLevel ?? "—"],
    ["Working hours", app.workingHours ?? "—"],
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href={`/${params.orgSlug}/adoptions`}>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Adoptions
        </Button>
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              app.applicationType === "FOSTER"
                ? "bg-blue-100 text-blue-700"
                : "bg-primary/10 text-primary"
            }`}>
              {app.applicationType === "FOSTER" ? "Foster application" : "Adoption application"}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{app.applicantName}</h1>
          <p className="text-muted-foreground text-sm">
            For {app.animal?.name} · {new Date(app.createdAt).toLocaleDateString("en-IE")}
          </p>
        </div>
        <Badge className="text-sm">{app.status.replace(/_/g, " ")}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Applicant details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value ?? "—"}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {app.whyAdopt && (
            <Card>
              <CardHeader><CardTitle className="text-base">Why do you want to adopt?</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{app.whyAdopt}</p></CardContent>
            </Card>
          )}

          {app.previousPets && (
            <Card>
              <CardHeader><CardTitle className="text-base">Previous pets</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{app.previousPets}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Actions panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Update status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Internal notes</Label>
                <Textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Notes visible to staff only…" />
              </div>
              <Button className="w-full" onClick={saveStatus} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </CardContent>
          </Card>

          {app.status === "APPROVED" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Contract & adoption</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" asChild>
                  <Link href={`/${params.orgSlug}/adoptions/${params.appId}/contract`}>Generate contract</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
