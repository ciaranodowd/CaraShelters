import { redirect } from "next/navigation"

export default function PortalRedirectPage({ params }: { params: { orgSlug: string } }) {
  redirect(`/portal/${params.orgSlug}`)
}
