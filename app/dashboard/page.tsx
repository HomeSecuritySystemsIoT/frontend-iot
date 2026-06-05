import { redirect } from "next/navigation"
import { Video, DoorOpen, ShieldCheck, Building2 } from "lucide-react"
import { getCurrentSession } from "@/lib/session"
import { isGroupMember } from "@/drizzle/actions/groups"
import { getHouseById } from "@/drizzle/actions/houses"
import { getRoomsWithCameraCount, getRoomById } from "@/drizzle/actions/rooms"
import { getCamerasByRoomId } from "@/drizzle/actions/cameras"
import { CameraCard } from "@/components/camera-card"
import { AddCameraDialog } from "@/components/add-camera-dialog"
import { AdminDebugButton } from "@/components/admin-debug-button"
import { AccessDenied } from "@/components/access-denied"
import { CreateDialog } from "@/components/create-dialog"
import { createRoom } from "@/app/dashboard/actions"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ house?: string; room?: string }>
}) {
  const { user } = await getCurrentSession()
  if (!user) redirect("/auth/login")

  const isAdmin = !!(process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL)
  const { house: houseStr, room: roomStr } = await searchParams
  const selectedHouseId = houseStr && !isNaN(Number(houseStr)) ? Number(houseStr) : null
  const selectedRoomId = roomStr && !isNaN(Number(roomStr)) ? Number(roomStr) : null

  // ── Room view (filtered cameras for one room) ────────────────────────────────
  if (selectedRoomId) {
    const room = await getRoomById(selectedRoomId)
    if (!room) redirect("/dashboard")

    const house = await getHouseById(room.houseId)
    if (!house) redirect("/dashboard")

    const member = await isGroupMember(house.groupId, user.id)
    if (!member) return <AccessDenied />

    const cameras = await getCamerasByRoomId(selectedRoomId)

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">{house.name}</p>
            <h1 className="text-lg font-semibold tracking-tight">{room.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cameras.length} {cameras.length === 1 ? "camera" : "cameras"} in this room
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-live" />
              System active
            </div>
            <AddCameraDialog roomId={room.id} groupId={house.groupId} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {cameras.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-4 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
                <Video className="size-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No cameras in this room</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Flash an ESP32-CAM with our firmware and it will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cameras.map((camera) => (
                <CameraCard key={camera.id} camera={camera} path="/dashboard" />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── House view (all cameras grouped by room) ─────────────────────────────────
  if (selectedHouseId) {
    const house = await getHouseById(selectedHouseId)
    if (!house) redirect("/dashboard")

    const member = await isGroupMember(house.groupId, user.id)
    if (!member) return <AccessDenied />

    const rooms = await getRoomsWithCameraCount(selectedHouseId)

    // No rooms yet → prompt to create one
    if (rooms.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{house.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">No rooms yet</p>
            </div>
            <CreateDialog
              title="Add a room"
              description="Add a room to start assigning cameras to it."
              action={createRoom}
              hiddenFields={{ houseId: house.id }}
              triggerLabel="Add room"
              submitLabel="Add room"
            />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
              <DoorOpen className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No rooms yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Add rooms to this building to start organising and assigning cameras.
              </p>
            </div>
            <CreateDialog
              title="Add a room"
              description="Add a room to start assigning cameras to it."
              action={createRoom}
              hiddenFields={{ houseId: house.id }}
              triggerLabel="Add your first room"
              submitLabel="Add room"
            />
          </div>
        </div>
      )
    }

    // Fetch cameras for each room
    const roomsWithCameras = await Promise.all(
      rooms.map(async (r) => ({
        room: r,
        cameras: await getCamerasByRoomId(r.id),
      }))
    )
    const totalCameras = roomsWithCameras.reduce((sum, { cameras }) => sum + cameras.length, 0)

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{house.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalCameras} {totalCameras === 1 ? "camera" : "cameras"} across {rooms.length}{" "}
              {rooms.length === 1 ? "room" : "rooms"}
            </p>
          </div>
          <CreateDialog
            title="Add a room"
            description="Add a room to start assigning cameras to it."
            action={createRoom}
            hiddenFields={{ houseId: house.id }}
            triggerLabel="Add room"
            submitLabel="Add room"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {roomsWithCameras.map(({ room, cameras }) => (
            <section key={room.id}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DoorOpen className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">{room.name}</h2>
                  <span className="text-xs text-muted-foreground">
                    ({cameras.length} {cameras.length === 1 ? "camera" : "cameras"})
                  </span>
                </div>
                <AddCameraDialog roomId={room.id} groupId={house.groupId} />
              </div>

              {cameras.length === 0 ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-muted-foreground text-sm">
                  <Video className="size-4 flex-shrink-0" />
                  <span>No cameras in this room yet.</span>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cameras.map((camera) => (
                    <CameraCard key={camera.id} camera={camera} path="/dashboard" />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    )
  }

  // ── No selection — welcome / empty state ─────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {isAdmin && (
        <div className="px-8 py-6 border-b border-border">
          <div className="p-5 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-sm font-semibold">All connected devices</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Admin view — live feeds for every device currently connected to the gateway.
            </p>
            <AdminDebugButton />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
          <Building2 className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">Select a building or room</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Choose a building from the sidebar to see all its cameras, or pick a specific room to
            filter the view.
          </p>
        </div>
      </div>
    </div>
  )
}
