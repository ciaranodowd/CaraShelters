"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { COUNTIES } from "@/lib/constants"

export default function AdoptApplicationPage() {
  const params = useParams()
  const [animal, setAnimal] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    applicationType: "ADOPT",
    applicantName: "", applicantEmail: "", applicantPhone: "",
    applicantAddress: "", applicantCounty: "",
    householdType: "", rentOrOwn: "", landlordPermission: false,
    hasGarden: false, gardenFenced: false,
    hasChildren: false, childrenAges: "",
    hasOtherPets: false, otherPetsDetails: "",
    experienceLevel: "", previousPets: "", whyAdopt: "", workingHours: "",
    gdprConsent: false,
  })

  useEffect(() => {
    fetch(`/api/portal/${params.orgSlug}/animals/${params.animalId}`)
      .then(r => r.json())
      .then(data => { setAnimal(data.animal); setOrg(data.org); setLoading(false) })
  }, [params.orgSlug, params.animalId])

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.gdprConsent) { setError("Please accept the privacy policy to continue"); return }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch(`/api/portal/${params.orgSlug}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, animalId: params.animalId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to submit application"); setSubmitting(false); return }
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
      setSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-sm space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">Application submitted!</h1>
          <p className="text-muted-foreground">
            Thank you for your interest in {animal?.name}.{" "}
            {org?.name} will review your application and be in touch within a few days.
          </p>
          <p className="text-sm text-muted-foreground bg-slate-50 rounded-xl p-4">
            Keep an eye on your inbox at <strong>{form.applicantEmail}</strong> for updates.
          </p>
          <Link href={`/portal/${params.orgSlug}`}>
            <Button variant="outline" className="w-full">See other animals looking for homes</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/portal/${params.orgSlug}/animals/${params.animalId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-semibold">Apply for {animal?.name}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {animal && (
          <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
              {animal.photos?.[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={animal.photos[0].url} alt={animal.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
              )}
            </div>
            <div>
              <p className="font-bold">{animal.name}</p>
              <p className="text-sm text-muted-foreground">{animal.species}{animal.breed ? ` · ${animal.breed}` : ""}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}

          {/* Application type */}
          <Card>
            <CardHeader><CardTitle className="text-base">I would like to…</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "ADOPT", label: "Adopt", sub: "Give {name} a permanent home" },
                  { value: "FOSTER", label: "Foster", sub: "Provide a temporary home" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, applicationType: opt.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${
                      form.applicationType === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {opt.sub.replace("{name}", animal?.name ?? "this animal")}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Your details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Full name <span className="text-destructive">*</span></Label>
                <Input placeholder="Jane Murphy" value={form.applicantName} onChange={set("applicantName")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.applicantEmail} onChange={set("applicantEmail")} required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input type="tel" value={form.applicantPhone} onChange={set("applicantPhone")} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input value={form.applicantAddress} onChange={set("applicantAddress")} />
              </div>
              <div className="space-y-1.5">
                <Label>County</Label>
                <Select value={form.applicantCounty} onValueChange={v => setForm(f => ({ ...f, applicantCounty: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                  <SelectContent>
                    {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Your home</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Home type</Label>
                  <Select value={form.householdType} onValueChange={v => setForm(f => ({ ...f, householdType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="apartment">Apartment / flat</SelectItem>
                      <SelectItem value="farm">Farm / rural</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Do you rent or own?</Label>
                  <Select value={form.rentOrOwn} onValueChange={v => setForm(f => ({ ...f, rentOrOwn: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">Own my home</SelectItem>
                      <SelectItem value="rent">Renting</SelectItem>
                      <SelectItem value="other">Other arrangement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.rentOrOwn === "rent" && (
                <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Checkbox
                    checked={form.landlordPermission}
                    onCheckedChange={v => setForm(f => ({ ...f, landlordPermission: v === true }))}
                    className="mt-0.5"
                  />
                  <span className="text-sm">My landlord has given permission for me to have a pet</span>
                </label>
              )}
              <div className="flex flex-wrap gap-4">
                {[
                  { key: "hasGarden", label: "Has a garden or outdoor space" },
                  { key: "gardenFenced", label: "Garden is fully fenced" },
                  { key: "hasChildren", label: "Children live at home" },
                  { key: "hasOtherPets", label: "Other pets at home" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={(form as any)[key]}
                      onCheckedChange={v => setForm(f => ({ ...f, [key]: v === true }))} />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
              {form.hasChildren && (
                <div className="space-y-1.5">
                  <Label>Children's ages</Label>
                  <Input placeholder="e.g. 3, 7, 12" value={form.childrenAges} onChange={set("childrenAges")} />
                </div>
              )}
              {form.hasOtherPets && (
                <div className="space-y-1.5">
                  <Label>Tell us about your other pets</Label>
                  <Textarea value={form.otherPetsDetails} onChange={set("otherPetsDetails")} rows={2} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Experience & lifestyle</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Experience with pets</Label>
                <Select value={form.experienceLevel} onValueChange={v => setForm(f => ({ ...f, experienceLevel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No previous experience</SelectItem>
                    <SelectItem value="some">Some experience</SelectItem>
                    <SelectItem value="experienced">Experienced owner</SelectItem>
                    <SelectItem value="expert">Expert / professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tell us about previous pets</Label>
                <Textarea placeholder="Any pets you've owned before…" value={form.previousPets}
                  onChange={set("previousPets")} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Why do you want to {form.applicationType === "FOSTER" ? "foster" : "adopt"} {animal?.name}?{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea value={form.whyAdopt} onChange={set("whyAdopt")} rows={3} required />
              </div>
              <div className="space-y-1.5">
                <Label>Typical working hours</Label>
                <Input placeholder="e.g. 9–5 Monday–Friday, work from home" value={form.workingHours} onChange={set("workingHours")} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
            <Checkbox id="gdpr" checked={form.gdprConsent}
              onCheckedChange={v => setForm(f => ({ ...f, gdprConsent: v === true }))} />
            <label htmlFor="gdpr" className="text-sm text-muted-foreground cursor-pointer">
              I consent to {org?.name} storing and processing my personal data to assess this adoption application.
              My data will be handled in accordance with GDPR and will not be shared with third parties.
            </label>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting…</>
              : `Submit ${form.applicationType === "FOSTER" ? "foster" : "adoption"} application`}
          </Button>
        </form>
      </main>
    </div>
  )
}
