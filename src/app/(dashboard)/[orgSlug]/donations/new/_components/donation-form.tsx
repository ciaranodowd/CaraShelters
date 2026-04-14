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

interface DonationFormProps {
  orgSlug: string
  orgId: string
}

export function DonationForm({ orgSlug, orgId }: DonationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({
    amount: "",
    donorName: "",
    donorEmail: "",
    paymentMethod: "cash",
    notes: "",
    donationDate: today,
  })

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, organizationId: orgId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        return
      }
      setSuccess(true)
      setTimeout(() => router.push(`/${orgSlug}/donations`), 1500)
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
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Donation recorded</h2>
          <p className="text-sm text-slate-500">Redirecting to donations…</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <Link href={`/${orgSlug}/donations`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to donations
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Record donation</h1>
        <p className="text-sm text-slate-500 mt-0.5">Log a new incoming donation</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Donation details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (€) <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={form.amount}
                    onChange={set("amount")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="donationDate">Date</Label>
                <Input
                  id="donationDate"
                  type="date"
                  value={form.donationDate}
                  onChange={set("donationDate")}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentMethod">Payment method</Label>
              <Select value={form.paymentMethod} onValueChange={v => setForm(f => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Donor <span className="font-normal normal-case text-slate-400">(optional)</span></h2>
            <div className="space-y-1.5">
              <Label htmlFor="donorName">Donor name</Label>
              <Input id="donorName" placeholder="Jane Smith" value={form.donorName} onChange={set("donorName")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="donorEmail">Donor email</Label>
              <Input id="donorEmail" type="email" placeholder="jane@example.com" value={form.donorEmail} onChange={set("donorEmail")} />
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</h2>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea id="notes" placeholder="Any additional information…" rows={3} value={form.notes} onChange={set("notes")} />
            </div>
          </div>

        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading} style={{ backgroundColor: "#1a3a2a" }}>
            {loading ? "Saving…" : "Record donation"}
          </Button>
        </div>
      </form>
    </>
  )
}
