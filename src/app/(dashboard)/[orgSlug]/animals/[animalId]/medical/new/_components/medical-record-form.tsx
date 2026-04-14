"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

const RECORD_TYPES = [
  { value: "VACCINATION", label: "Vaccination" },
  { value: "NEUTERING", label: "Neutering / Spay" },
  { value: "VET_VISIT", label: "Vet visit" },
  { value: "MEDICATION", label: "Medication" },
  { value: "SURGERY", label: "Surgery" },
  { value: "DENTAL", label: "Dental" },
  { value: "PARASITE_TREATMENT", label: "Parasite treatment" },
  { value: "WEIGHT_CHECK", label: "Weight check" },
  { value: "BLOOD_TEST", label: "Blood test" },
  { value: "OTHER", label: "Other" },
]

interface Props { orgSlug: string; animalId: string; animalName: string }

export function MedicalRecordForm({ orgSlug, animalId, animalName }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({
    type: "VET_VISIT",
    description: "",
    date: today,
    vetName: "",
    vetClinic: "",
    cost: "",
    notes: "",
    nextDueDate: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch(`/api/animals/${animalId}/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      setSuccess(true)
      setTimeout(() => router.push(`/${orgSlug}/animals/${animalId}?tab=medical`), 1500)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="bg-white rounded-xl border border-slate-100 p-10 text-center max-w-sm w-full">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Record saved</h2>
          <p className="text-sm text-slate-500">Redirecting to {animalName}&apos;s profile…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Link href={`/${orgSlug}/animals/${animalId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to {animalName}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Add medical record</h1>
        <p className="text-sm text-slate-500 mt-0.5">For {animalName}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Record details</h2>
            <div className="space-y-1.5">
              <Label htmlFor="type">Record type <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Input id="description" placeholder="e.g. Annual booster vaccination" value={form.description} onChange={set("description")} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input id="date" type="date" value={form.date} onChange={set("date")} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextDueDate">Next due date</Label>
                <Input id="nextDueDate" type="date" value={form.nextDueDate} onChange={set("nextDueDate")} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Vet details <span className="font-normal normal-case text-slate-400">(optional)</span></h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vetName">Vet name</Label>
                <Input id="vetName" placeholder="Dr. Murphy" value={form.vetName} onChange={set("vetName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vetClinic">Clinic</Label>
                <Input id="vetClinic" placeholder="City Vet Clinic" value={form.vetClinic} onChange={set("vetClinic")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Cost (€)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
                <Input id="cost" type="number" step="0.01" min="0" placeholder="0.00" className="pl-7" value={form.cost} onChange={set("cost")} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</h2>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Additional notes</Label>
              <Textarea id="notes" placeholder="Any additional details…" rows={3} value={form.notes} onChange={set("notes")} />
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading} style={{ backgroundColor: "#1a3a2a" }}>
            {loading ? "Saving…" : "Save record"}
          </Button>
        </div>
      </form>
    </>
  )
}
