"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { initials } from "@/lib/utils"

export function TeamSettings({ org, members, currentUserId, isAdmin }: {
  org: any; members: any[]; currentUserId: string; isAdmin: boolean
}) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("STAFF")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError("")
    setInviteSuccess("")
    const res = await fetch(`/api/orgs/${org.slug}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    setInviting(false)
    if (res.ok) {
      setInviteSuccess(`Invite sent to ${inviteEmail}`)
      setInviteEmail("")
      router.refresh()
    } else {
      const data = await res.json()
      setInviteError(data.error ?? "Failed to send invite")
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    STAFF: "bg-blue-100 text-blue-700",
    VOLUNTEER: "bg-green-100 text-green-700",
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team members</CardTitle>
          <CardDescription>{members.length} member{members.length !== 1 ? "s" : ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {members.map(m => (
              <div key={m.userId} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    {m.user.image && <AvatarImage src={m.user.image} />}
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials(m.user.name ?? m.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{m.user.name ?? "—"} {m.userId === currentUserId && <span className="text-xs text-muted-foreground">(you)</span>}</p>
                    <p className="text-xs text-muted-foreground">{m.user.email}</p>
                  </div>
                </div>
                <Badge className={`text-xs ${roleColors[m.role] ?? ""} hover:${roleColors[m.role]}`}>{m.role}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite team member</CardTitle>
            <CardDescription>They'll receive an email to join your organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-3">
              {inviteError && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{inviteError}</div>}
              {inviteSuccess && <div className="text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">{inviteSuccess}</div>}
              <div className="flex gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Email address</Label>
                  <Input type="email" placeholder="colleague@shelter.ie" value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div className="w-32 space-y-1.5">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="VOLUNTEER">Volunteer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
