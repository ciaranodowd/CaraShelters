"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { COUNTIES } from "@/lib/constants"

export function OrgSettingsForm({ org, isAdmin }: { org: any; isAdmin: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: org.name ?? "",
    email: org.email ?? "",
    phone: org.phone ?? "",
    address: org.address ?? "",
    city: org.city ?? "",
    county: org.county ?? "",
    country: org.country ?? "IE",
    website: org.website ?? "",
    chyNumber: org.chyNumber ?? "",
    description: org.description ?? "",
  })

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSaved(false)
    const res = await fetch(`/api/orgs/${org.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to save")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organisation details</CardTitle>
        <CardDescription>Update your shelter&apos;s public information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}
          {saved && <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">Settings saved successfully</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Organisation name</Label>
              <Input value={form.name} onChange={set("name")} disabled={!isAdmin} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input type="email" value={form.email} onChange={set("email")} disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={set("phone")} disabled={!isAdmin} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={set("address")} disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label>City / Town</Label>
              <Input value={form.city} onChange={set("city")} disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label>County</Label>
              <Select value={form.county} onValueChange={v => setForm(f => ({ ...f, county: v }))} disabled={!isAdmin}>
                <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                <SelectContent>
                  {COUNTIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>CHY / Charity number</Label>
              <Input placeholder="CHY12345" value={form.chyNumber} onChange={set("chyNumber")} disabled={!isAdmin} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://rescue.ie" value={form.website} onChange={set("website")} disabled={!isAdmin} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Description (shown on public portal)</Label>
              <Textarea value={form.description} onChange={set("description")} rows={3} disabled={!isAdmin} />
            </div>
          </div>

          {isAdmin && (
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
