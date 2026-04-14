"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function ProfilePage() {
  const params = useParams<{ orgSlug: string }>()
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name ?? "")
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      await update({ name: data.name })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-8 max-w-lg mx-auto">
        <div className="mb-6">
          <Link href={`/${params.orgSlug}/settings`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to settings
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Update your account details</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={session?.user?.email ?? ""} disabled className="bg-slate-50 text-slate-500" />
              <p className="text-xs text-slate-400">Email cannot be changed here</p>
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
            <Button type="submit" disabled={loading} style={{ backgroundColor: "#1a3a2a" }}>
              {loading ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
