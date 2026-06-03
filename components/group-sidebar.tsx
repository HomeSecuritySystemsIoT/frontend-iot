"use client"

import * as React from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import {
  Shield,
  LogOut,
  Camera,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Menu,
  Building2,
  DoorOpen,
} from "lucide-react"
import { logout } from "@/app/auth/actions"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface Room {
  id: number
  name: string
  cameraCount: number
}

interface House {
  id: number
  name: string
  rooms: Room[]
}

interface GroupInfo {
  id: number
  name: string
  role: string
}

interface GroupSidebarProps {
  groupId: number
  groupName: string
  userRole: string
  userEmail: string
  houses: House[]
  allGroups: GroupInfo[]
}

function SidebarContent({
  groupId,
  groupName,
  userRole,
  userEmail,
  houses,
  allGroups,
  onNavigate,
}: GroupSidebarProps & { onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeRoomId = searchParams.get("room") ? Number(searchParams.get("room")) : null

  const activeRoomHouseId = React.useMemo(() => {
    if (!activeRoomId) return null
    for (const h of houses) {
      if (h.rooms.some((r) => r.id === activeRoomId)) return h.id
    }
    return null
  }, [activeRoomId, houses])

  const [expandedHouses, setExpandedHouses] = React.useState<Set<number>>(() => {
    const initial = new Set<number>()
    if (activeRoomHouseId) initial.add(activeRoomHouseId)
    else if (houses.length > 0) initial.add(houses[0].id)
    return initial
  })

  const initials = userEmail.slice(0, 2).toUpperCase()
  const isAllCamerasActive = pathname === `/dashboard/${groupId}` && !activeRoomId

  function toggleHouse(houseId: number) {
    setExpandedHouses((prev) => {
      const next = new Set(prev)
      if (next.has(houseId)) next.delete(houseId)
      else next.add(houseId)
      return next
    })
  }

  function navigate(href: string) {
    router.push(href)
    onNavigate?.()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Branding */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border flex-shrink-0">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Shield className="size-4" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">OpenCam</span>
      </div>

      {/* Group selector */}
      <div className="px-3 pt-3 pb-1 flex-shrink-0">
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Group
        </p>
        {allGroups.length > 1 ? (
          <div className="relative">
            <select
              className="w-full appearance-none rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground px-2.5 py-2 pr-7 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sidebar-ring cursor-pointer"
              value={groupId}
              onChange={(e) => navigate(`/dashboard/${e.target.value}`)}
            >
              {allGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-sidebar-accent">
            <Building2 className="size-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{groupName}</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {/* All cameras */}
        <button
          onClick={() => navigate(`/dashboard/${groupId}`)}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            isAllCamerasActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-4 flex-shrink-0" />
          All cameras
        </button>

        {/* Houses */}
        {houses.length > 0 && (
          <div className="pt-2">
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Houses
            </p>
            <div className="space-y-0.5">
              {houses.map((house) => {
                const expanded = expandedHouses.has(house.id)
                return (
                  <div key={house.id}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHouse(house.id)}
                        className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors min-w-0"
                      >
                        {expanded ? (
                          <ChevronDown className="size-3.5 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="size-3.5 flex-shrink-0" />
                        )}
                        <Building2 className="size-3.5 flex-shrink-0" />
                        <span className="truncate">{house.name}</span>
                      </button>
                    </div>

                    {expanded && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                        {house.rooms.length === 0 ? (
                          <p className="px-2 py-1.5 text-xs text-muted-foreground/60 italic">
                            No rooms
                          </p>
                        ) : (
                          house.rooms.map((room) => {
                            const isActive = activeRoomId === room.id
                            return (
                              <button
                                key={room.id}
                                onClick={() =>
                                  navigate(`/dashboard/${groupId}?room=${room.id}`)
                                }
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                                }`}
                              >
                                <DoorOpen className="size-3.5 flex-shrink-0" />
                                <span className="truncate flex-1 text-left">{room.name}</span>
                                <span className="flex-shrink-0 flex items-center gap-0.5 text-[10px] opacity-60">
                                  <Camera className="size-2.5" />
                                  {room.cameraCount}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userEmail}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{userRole}</p>
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
    </div>
  )
}

export function GroupSidebar(props: GroupSidebarProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex app-sidebar">
        <React.Suspense>
          <SidebarContent {...props} />
        </React.Suspense>
      </aside>

      {/* Mobile: hamburger + Sheet */}
      <div className="flex md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              className="fixed top-3 left-3 z-40 flex size-8 items-center justify-center rounded-lg border border-border bg-card shadow-sm"
              aria-label="Open navigation"
            >
              <Menu className="size-4" />
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <React.Suspense>
              <SidebarContent {...props} onNavigate={() => setSheetOpen(false)} />
            </React.Suspense>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
