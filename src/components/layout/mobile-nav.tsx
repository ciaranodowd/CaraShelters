"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, PawPrint, Users, Heart, DollarSign } from "lucide-react"

interface MobileNavProps {
  orgSlug: string
}

export function MobileNav({ orgSlug }: MobileNavProps) {
  const pathname = usePathname()

  const items = [
    { href: `/${orgSlug}`, label: "Home", icon: LayoutDashboard, exact: true },
    { href: `/${orgSlug}/animals`, label: "Animals", icon: PawPrint },
    { href: `/${orgSlug}/people`, label: "People", icon: Users },
    { href: `/${orgSlug}/adoptions`, label: "Adoptions", icon: Heart },
    { href: `/${orgSlug}/donations`, label: "Donate", icon: DollarSign },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-40">
      <div className="flex">
        {items.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-slate-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
