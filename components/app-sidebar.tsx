"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shield, LogOut, LayoutGrid } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { logout } from "@/app/auth/actions"

export function AppSidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <aside className="app-sidebar">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Shield className="size-4" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">OpenCam</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Navigation
        </p>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-4 flex-shrink-0" />
          Groups
        </Link>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user.email}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  )
}
