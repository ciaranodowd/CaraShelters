"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle, Users } from "lucide-react"
import Link from "next/link"

interface Foster { id: string; firstName: string; lastName: string; email: string }
interface Props { orgSlug: string; animalId: string; animalName: string; fosters: Foster[] }

export function FosterAssignForm({ orgSlug, animalId, animalName, fosters }: Props) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({ fosterId: "", startDate: today, endDate: "", notes: "" })
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
      const res = await fetch(`/api/animals/${animalId}/foster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      setSuccess(true)
      setTimeout(() => router.push(`/${orgSlug}/animals/${animalId}?tab=foster`), 1500)
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
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Foster assigned</h2>
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
        <h1 className="text-2xl font-bold text-slate-900">Assign foster</h1>
        <p className="text-sm text-slate-500 mt-0.5">For {animalName}</p>
      </div>

      {fosters.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No approved fosters</p>
          <p className="text-sm text-slate-400 mt-1">Add and approve fosters in the People section before assigning.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/${orgSlug}/people?tab=fosters`}>Go to fosters</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">

            <div className="p-6 space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Foster carer</h2>
              <div className="space-y-1.5">
                <Label htmlFor="foster">Foster carer <span className="text-red-500">*</span></Label>
                <Select value={form.fosterId} onValueChange={v => setForm(f => ({ ...f, fosterId: v }))} required>
                  <SelectTrigger id="foster"><SelectValue placeholder="Select a foster carer…" /></SelectTrigger>
                  <SelectContent>
                    {fosters.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.firstName} {f.lastName} — {f.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate">Start date <span className="text-red-500">*</span></Label>
                  <Input id="startDate" type="date" value={form.startDate} onChange={set("startDate")} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endDate">End date <span className="text-slate-400 font-normal">(leave blank if ongoing)</span></Label>
                  <Input id="endDate" type="date" value={form.endDate} onChange={set("endDate")} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</h2>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Any handover notes or special requirements…" rows={3} value={form.notes} onChange={set("notes")} />
              </div>
            </div>

          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.fosterId} style={{ backgroundColor: "#1a3a2a" }}>
              {loading ? "Saving…" : "Assign foster"}
            </Button>
          </div>
        </form>
      )}
    </>
  )
}
