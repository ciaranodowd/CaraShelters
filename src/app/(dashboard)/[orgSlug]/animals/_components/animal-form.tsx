"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { SPECIES_LABELS, SIZE_LABELS } from "@/lib/constants"

interface AnimalFormProps {
  orgSlug: string
  orgId: string
  animal?: any
}

export function AnimalForm({ orgSlug, orgId, animal }: AnimalFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: animal?.name ?? "",
    species: animal?.species ?? "DOG",
    breed: animal?.breed ?? "",
    colour: animal?.colour ?? "",
    sex: animal?.sex ?? "UNKNOWN",
    size: animal?.size ?? "MEDIUM",
    dobApprox: animal?.dobApprox ? new Date(animal.dobApprox).toISOString().split("T")[0] : "",
    intakeDate: animal?.intakeDate ? new Date(animal.intakeDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    intakeType: animal?.intakeType ?? "STRAY",
    microchipNumber: animal?.microchipNumber ?? "",
    weight: animal?.weightKg ? String(animal.weightKg) : "",
    neutered: animal?.neutered ?? false,
    vaccinated: animal?.vaccinated ?? false,
    description: animal?.description ?? "",
    notes: animal?.notes ?? "",
    status: animal?.status ?? "INTAKE",
    publicProfile: animal?.publicProfile ?? false,
  })

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }
  function setSelect(field: string) {
    return (v: string) => setForm(f => ({ ...f, [field]: v }))
  }
  function setCheck(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [field]: e.target.checked }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const body: any = { ...form, organizationId: orgId }
    if (form.dobApprox) body.dobApprox = new Date(form.dobApprox).toISOString()
    if (form.weight) body.weight = parseFloat(form.weight)
    else delete body.weight
    // Only send status on edit; new animals always start as INTAKE
    if (!animal) delete body.status

    const url = animal ? `/api/animals/${animal.id}` : "/api/animals"
    const method = animal ? "PATCH" : "POST"
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save animal"); setLoading(false); return }
      router.push(`/${orgSlug}/animals/${data.id}`)
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input placeholder="Buddy" value={form.name} onChange={set("name")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Species <span className="text-destructive">*</span></Label>
              <Select value={form.species} onValueChange={setSelect("species")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SPECIES_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={setSelect("sex")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="UNKNOWN">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Breed</Label>
              <Input placeholder="Labrador Mix" value={form.breed} onChange={set("breed")} />
            </div>
            <div className="space-y-1.5">
              <Label>Colour</Label>
              <Input placeholder="Black & white" value={form.colour} onChange={set("colour")} />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Select value={form.size} onValueChange={setSelect("size")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SIZE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date of birth (approx)</Label>
              <Input type="date" value={form.dobApprox} onChange={set("dobApprox")} />
            </div>
            <div className="space-y-1.5">
              <Label>Intake date <span className="text-destructive">*</span></Label>
              <Input type="date" value={form.intakeDate} onChange={set("intakeDate")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Intake type</Label>
              <Select value={form.intakeType} onValueChange={setSelect("intakeType")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRAY">Stray</SelectItem>
                  <SelectItem value="SURRENDER">Owner surrender</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="BORN_IN_CARE">Born in care</SelectItem>
                  <SelectItem value="CONFISCATED">Confiscated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Microchip number</Label>
              <Input placeholder="981000000000000" value={form.microchipNumber} onChange={set("microchipNumber")} />
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" step="0.1" min="0" placeholder="12.5" value={form.weight} onChange={set("weight")} />
            </div>
          </div>

          {animal && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={setSelect("status")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTAKE">Intake</SelectItem>
                  <SelectItem value="ASSESSMENT">Assessment</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="FOSTERED">In Foster</SelectItem>
                  <SelectItem value="ADOPTION_PENDING">Adoption Pending</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="MEDICAL_HOLD">Medical Hold</SelectItem>
                  <SelectItem value="QUARANTINE">Quarantine</SelectItem>
                  <SelectItem value="ADOPTED">Adopted</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="DECEASED">Deceased</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.neutered} onChange={setCheck("neutered")} />
              <span className="text-sm">Neutered / spayed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.vaccinated} onChange={setCheck("vaccinated")} />
              <span className="text-sm">Vaccinated</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded" checked={form.publicProfile} onChange={setCheck("publicProfile")} />
              <span className="text-sm">Publish to public portal</span>
            </label>
          </div>

          <div className="space-y-1.5">
            <Label>Description (public-facing)</Label>
            <Textarea placeholder="Buddy is a gentle, playful Labrador who loves cuddles…" value={form.description}
              onChange={set("description")} rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label>Internal notes</Label>
            <Textarea placeholder="Notes for staff only…" value={form.notes} onChange={set("notes")} rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : animal ? "Save changes" : "Add animal"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
