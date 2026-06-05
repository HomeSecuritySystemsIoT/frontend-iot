"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Shield,
  LogOut,
  ChevronRight,
  ChevronDown,
  Building2,
  DoorOpen,
  Camera,
  CircleUser,
  Plus,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { logout } from "@/app/auth/actions"
import { CreateDialog } from "@/components/create-dialog"
import { createGroup, createHouse, createRoom } from "@/app/dashboard/actions"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type RoomItem = { id: number; name: string; houseId: number; cameraCount: number }
type HouseItem = {
  id: number
  name: string
  address: string | null
  groupId: number
  rooms: RoomItem[]
}
type GroupItem = { id: number; name: string; role: string; houses: HouseItem[] }

interface AppSidebarProps {
  hierarchy: GroupItem[]
}

function findGroupForActiveItem(
  hierarchy: GroupItem[],
  activeHouseId: number | null,
  activeRoomId: number | null
): number | null {
  if (activeHouseId) {
    for (const g of hierarchy) {
      if (g.houses.some((h) => h.id === activeHouseId)) return g.id
    }
  }
  if (activeRoomId) {
    for (const g of hierarchy) {
      for (const h of g.houses) {
        if (h.rooms.some((r) => r.id === activeRoomId)) return g.id
      }
    }
  }
  return hierarchy[0]?.id ?? null
}

export function AppSidebar({ hierarchy }: AppSidebarProps) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const activeHouseId = searchParams.get("house") ? Number(searchParams.get("house")) : null
  const activeRoomId = searchParams.get("room") ? Number(searchParams.get("room")) : null

  const [groupsOpen, setGroupsOpen] = React.useState(true)
  const [buildingsOpen, setBuildingsOpen] = React.useState(true)

  const [selectedGroupId, setSelectedGroupId] = React.useState<number | null>(
    () => findGroupForActiveItem(hierarchy, activeHouseId, activeRoomId)
  )

  const [expandedHouses, setExpandedHouses] = React.useState<Set<number>>(() => {
    const initGroupId = findGroupForActiveItem(hierarchy, activeHouseId, activeRoomId)
    const group = hierarchy.find((g) => g.id === initGroupId)
    return new Set(group?.houses.map((h) => h.id) ?? [])
  })

  // Sync selectedGroupId when URL changes (e.g. user navigates to another group's house/room)
  React.useEffect(() => {
    const derived = findGroupForActiveItem(hierarchy, activeHouseId, activeRoomId)
    if (derived !== null) setSelectedGroupId(derived)
  }, [activeHouseId, activeRoomId, hierarchy])

  // When selectedGroupId changes: expand all houses of new group; auto-expand new houses in same group
  const prevGroupRef = React.useRef(selectedGroupId)
  React.useEffect(() => {
    if (prevGroupRef.current !== selectedGroupId) {
      prevGroupRef.current = selectedGroupId
      const g = hierarchy.find((grp) => grp.id === selectedGroupId)
      setExpandedHouses(new Set(g?.houses.map((h) => h.id) ?? []))
    } else {
      setExpandedHouses((prev) => {
        const g = hierarchy.find((grp) => grp.id === selectedGroupId)
        if (!g) return prev
        const next = new Set(prev)
        let changed = false
        g.houses.forEach((h) => {
          if (!prev.has(h.id)) { next.add(h.id); changed = true }
        })
        return changed ? next : prev
      })
    }
  }, [selectedGroupId, hierarchy])

  if (!user) return null

  const initials = user.email.slice(0, 2).toUpperCase()
  const selectedGroup = hierarchy.find((g) => g.id === selectedGroupId)

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Shield className="size-4" />
        </div>
        <span className="font-semibold text-[15px] tracking-tight">OpenCam</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Section 1: Groups ── */}
        <div className="px-3 pt-4 pb-3">
          <button
            onClick={() => setGroupsOpen((o) => !o)}
            className="flex items-center justify-between w-full px-2 mb-1 group/sec"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover/sec:text-muted-foreground/80 transition-colors">
              Groups
            </span>
            <div className="flex items-center gap-0.5">
              <span
                className="opacity-0 group-hover/sec:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <CreateDialog
                  title="Create a group"
                  description="A group lets you manage buildings and share access with other members."
                  action={createGroup}
                  triggerLabel="New group"
                  submitLabel="Create group"
                  trigger={
                    <Button variant="ghost" size="icon-xs" title="New group">
                      <Plus className="size-3" />
                    </Button>
                  }
                />
              </span>
              {groupsOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground/40" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
              )}
            </div>
          </button>

          {groupsOpen && (
            <div className="space-y-0.5">
              {hierarchy.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No groups yet
                </p>
              ) : (
                hierarchy.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedGroupId === group.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <CircleUser className="size-4 flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{group.name}</span>
                    <span className="text-[10px] opacity-50 capitalize flex-shrink-0">
                      {group.role}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-sidebar-border" />

        {/* ── Section 2: Buildings ── */}
        <div className="px-3 py-3">
          <button
            onClick={() => setBuildingsOpen((o) => !o)}
            className="flex items-center justify-between w-full px-2 mb-1 group/sec"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 group-hover/sec:text-muted-foreground/80 transition-colors">
              Buildings
            </span>
            <div className="flex items-center gap-0.5">
              {selectedGroupId && (
                <span
                  className="opacity-0 group-hover/sec:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <CreateDialog
                    title="Add a building"
                    description="Add a building to this group to start organising rooms and cameras."
                    action={createHouse}
                    hiddenFields={{ groupId: selectedGroupId }}
                    triggerLabel="Add building"
                    submitLabel="Add building"
                    extraFields={
                      <Field>
                        <FieldLabel htmlFor="address">Address (optional)</FieldLabel>
                        <Input id="address" name="address" placeholder="123 Main St" />
                      </Field>
                    }
                    trigger={
                      <Button variant="ghost" size="icon-xs" title="Add building">
                        <Plus className="size-3" />
                      </Button>
                    }
                  />
                </span>
              )}
              {buildingsOpen ? (
                <ChevronDown className="size-3.5 text-muted-foreground/40" />
              ) : (
                <ChevronRight className="size-3.5 text-muted-foreground/40" />
              )}
            </div>
          </button>

          {buildingsOpen && (
            <div className="space-y-0.5">
              {!selectedGroup ? (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  Select a group first
                </p>
              ) : selectedGroup.houses.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground text-center">
                  No buildings yet
                </p>
              ) : (
                selectedGroup.houses.map((house) => (
                  <div key={house.id}>
                    {/* House row */}
                    <div
                      className={`flex items-center rounded-lg group/house ${
                        activeHouseId === house.id && !activeRoomId
                          ? "bg-primary/10"
                          : ""
                      }`}
                    >
                      {/* Chevron: expand/collapse rooms only */}
                      <button
                        onClick={() =>
                          setExpandedHouses((prev) => {
                            const next = new Set(prev)
                            next.has(house.id) ? next.delete(house.id) : next.add(house.id)
                            return next
                          })
                        }
                        className="flex items-center justify-center w-7 h-8 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {expandedHouses.has(house.id) ? (
                          <ChevronDown className="size-3.5" />
                        ) : (
                          <ChevronRight className="size-3.5" />
                        )}
                      </button>

                      {/* House name → navigate to house view */}
                      <button
                        onClick={() => router.push(`/dashboard?house=${house.id}`)}
                        className={`flex items-center gap-2 flex-1 py-1.5 pr-1 text-sm min-w-0 transition-colors ${
                          activeHouseId === house.id && !activeRoomId
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Building2 className="size-4 flex-shrink-0" />
                        <span className="truncate">{house.name}</span>
                      </button>

                      {/* Add room (hover) */}
                      <span className="opacity-0 group-hover/house:opacity-100 transition-opacity flex-shrink-0 pr-1">
                        <CreateDialog
                          title="Add a room"
                          description="Add a room to start assigning cameras."
                          action={createRoom}
                          hiddenFields={{ houseId: house.id }}
                          triggerLabel="Add room"
                          submitLabel="Add room"
                          trigger={
                            <Button variant="ghost" size="icon-xs" title="Add room">
                              <Plus className="size-3" />
                            </Button>
                          }
                        />
                      </span>
                    </div>

                    {/* Room items — pl-5 wrapper provides indentation without causing overflow */}
                    {expandedHouses.has(house.id) && (
                      <div className="pl-5 space-y-1 mt-1">
                        {house.rooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => router.push(`/dashboard?room=${room.id}`)}
                            className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${
                              activeRoomId === room.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <DoorOpen className="size-3.5 flex-shrink-0 mt-0.5" />
                            <span className="flex-1 min-w-0 break-words leading-snug">
                              {room.name}
                            </span>
                            {room.cameraCount > 0 && (
                              <span className="flex items-center gap-0.5 text-xs opacity-50 flex-shrink-0 mt-0.5">
                                <Camera className="size-3" />
                                {room.cameraCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-accent transition-colors">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {selectedGroup?.role ?? "member"}
            </p>
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
