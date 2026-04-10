"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"

export function GdprSettings({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orgs/${orgSlug}/gdpr`)
      .then(r => r.json())
      .then(data => { setRequests(data); setLoading(false) })
  }, [orgSlug])

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">GDPR data requests</CardTitle>
          <CardDescription>
            Subject access requests (SARs) and deletion requests submitted by individuals.
            You must respond within 30 days under GDPR.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No GDPR requests on file</p>
          ) : (
            <div className="divide-y">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{r.requesterName}</p>
                    <p className="text-xs text-muted-foreground">{r.requesterEmail} · {r.type.replace(/_/g, " ")} · {formatDate(r.createdAt)}</p>
                  </div>
                  <Badge className={`text-xs ${statusColors[r.status] ?? ""} hover:${statusColors[r.status]}`}>{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">GDPR compliance checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {[
              "All adopter and foster data collected with explicit consent",
              "Consent timestamp and IP recorded at point of collection",
              "Marketing consent recorded separately from necessary processing",
              "Data retention policy enforced — records auto-expire after configurable period",
              "Subject access and deletion requests handled within 30 days",
              "Data never shared with third parties without consent",
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
