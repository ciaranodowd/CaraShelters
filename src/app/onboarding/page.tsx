"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { COUNTIES } from "@/lib/constants"

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "",
    country: "IE",
    website: "",
    chyNumber: "",
    description: "",
  })

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); setLoading(false); return }
      router.push(`/${data.slug}`)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">C</div>
            <span className="text-2xl font-bold text-primary">Cara</span>
          </div>
          <p className="text-sm text-muted-foreground">Let's set up your shelter</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shelter details</CardTitle>
            <CardDescription>Tell us about your rescue organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Organisation name <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="Paws & Claws Rescue" value={form.name}
                    onChange={set("name")} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Contact email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" placeholder="info@rescue.ie" value={form.email}
                    onChange={set("email")} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+353 1 234 5678" value={form.phone} onChange={set("phone")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main Street" value={form.address} onChange={set("address")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City / Town</Label>
                  <Input id="city" placeholder="Dublin" value={form.city} onChange={set("city")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="county">County</Label>
                  <Select value={form.county} onValueChange={v => setForm(f => ({ ...f, county: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="chyNumber">CHY / Charity number</Label>
                  <Input id="chyNumber" placeholder="CHY12345" value={form.chyNumber} onChange={set("chyNumber")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://rescue.ie" value={form.website} onChange={set("website")} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="description">About your rescue</Label>
                  <Textarea id="description" placeholder="Tell adopters about your organisation…"
                    value={form.description} onChange={set("description")} rows={3} />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? "Setting up…" : "Create shelter →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
