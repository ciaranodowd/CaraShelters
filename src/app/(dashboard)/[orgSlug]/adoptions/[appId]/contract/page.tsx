"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, FileText, CheckCircle } from "lucide-react"

export default function ContractPage() {
  const params = useParams<{ orgSlug: string; appId: string }>()
  const router = useRouter()

  const [app, setApp] = useState<any>(null)
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    adoptionFee: "",
    contractText: "",
  })

  useEffect(() => {
    fetch(`/api/applications/${params.appId}`)
      .then(r => r.json())
      .then(data => {
        setApp(data)
        if (data.contract) {
          setContract(data.contract)
          setForm({
            adoptionFee: data.contract.adoptionFee ? String(data.contract.adoptionFee) : "",
            contractText: data.contract.contractText ?? "",
          })
        } else {
          // Pre-fill with a default contract template
          setForm(f => ({
            ...f,
            contractText: generateTemplate(data),
          }))
        }
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.appId])

  function generateTemplate(data: any) {
    return `ADOPTION AGREEMENT

This agreement is made between ${data.animal?.name ?? "[Animal name]"} Animal Rescue and the adopter named below.

Adopter: ${data.applicantName}
Animal: ${data.animal?.name ?? "[Animal name]"}
Date: ${new Date().toLocaleDateString("en-IE")}

By signing this agreement, the adopter agrees to:

1. Provide a safe, loving, and permanent home for the animal.
2. Provide adequate food, water, shelter, and veterinary care.
3. Keep the animal as an indoor/supervised pet and not allow roaming.
4. Contact the rescue if they are unable to keep the animal at any time.
5. Not transfer ownership of the animal without prior consent of the rescue.

The rescue reserves the right to reclaim the animal if these conditions are not met.

Signed: _________________________ Date: _____________
`
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch(`/api/applications/${params.appId}/contract`, {
        method: contract ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adoptionFee: form.adoptionFee ? parseFloat(form.adoptionFee) : null,
          contractText: form.contractText,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      setContract(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Application not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <Link href={`/${params.orgSlug}/adoptions/${params.appId}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to application
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-slate-400" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Adoption contract</h1>
              <p className="text-sm text-slate-500">{app.applicantName} · {app.animal?.name}</p>
            </div>
          </div>
        </div>

        {contract?.signedAt && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-3 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Signed on {new Date(contract.signedAt).toLocaleDateString("en-IE")}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-50">

            <div className="p-6 space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Adoption fee</h2>
              <div className="space-y-1.5 max-w-xs">
                <Label htmlFor="fee">Fee (€)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">€</span>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-7"
                    value={form.adoptionFee}
                    onChange={e => setForm(f => ({ ...f, adoptionFee: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contract text</h2>
              <div className="space-y-1.5">
                <Label htmlFor="contractText">Contract <span className="text-red-500">*</span></Label>
                <Textarea
                  id="contractText"
                  rows={16}
                  className="font-mono text-sm"
                  value={form.contractText}
                  onChange={e => setForm(f => ({ ...f, contractText: e.target.value }))}
                  required
                />
              </div>
            </div>

          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" /> Saved
              </span>
            )}
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} style={{ backgroundColor: "#1a3a2a" }}>
              {saving ? "Saving…" : contract ? "Update contract" : "Save contract"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
