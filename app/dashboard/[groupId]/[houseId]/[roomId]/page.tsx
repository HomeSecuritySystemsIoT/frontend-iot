import { redirect, notFound } from "next/navigation"
import { Video } from "lucide-react"
import { getCurrentSession } from "@/lib/session"
import { getGroupById, isGroupMember } from "@/drizzle/actions/groups"
import { AccessDenied } from "@/components/access-denied"
import { getHouseById } from "@/drizzle/actions/houses"
import { getRoomById } from "@/drizzle/actions/rooms"
import { getCamerasByRoomId } from "@/drizzle/actions/cameras"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { CameraCard } from "@/components/camera-card"
import { AddCameraDialog } from "@/components/add-camera-dialog"

export default async function RoomPage({
  params,
}: {
  params: Promise<{ groupId: string; houseId: string; roomId: string }>
}) {
  const { user } = await getCurrentSession()
  if (!user) redirect("/auth/login")

  const { groupId: groupIdStr, houseId: houseIdStr, roomId: roomIdStr } = await params
  const groupId = Number(groupIdStr)
  const houseId = Number(houseIdStr)
  const roomId = Number(roomIdStr)
  if (isNaN(groupId) || isNaN(houseId) || isNaN(roomId)) notFound()

  const [group, house, room, member, cameras] = await Promise.all([
    getGroupById(groupId),
    getHouseById(houseId),
    getRoomById(roomId),
    isGroupMember(groupId, user.id),
    getCamerasByRoomId(roomId),
  ])

  if (!group || !house || !room) notFound()
  if (!member || house.groupId !== groupId || room.houseId !== houseId)
    return <AccessDenied />

  const path = `/dashboard/${groupId}/${houseId}/${roomId}`

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
        <div>
          <DashboardBreadcrumb items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: group.name, href: `/dashboard/${groupId}` },
            { label: house.name, href: `/dashboard/${groupId}/${houseId}` },
            { label: room.name },
          ]} />
          <h1 className="text-lg font-semibold tracking-tight mt-1.5">{room.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {cameras.length} {cameras.length === 1 ? "camera" : "cameras"} connected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <span className="size-2 rounded-full bg-emerald-500 animate-live" />
            System active
          </div>
          <AddCameraDialog roomId={roomId} groupId={groupId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        {cameras.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
              <Video className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No cameras set up</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Flash an ESP32-CAM with our firmware and it will appear here
                automatically once it connects to your account.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cameras.map((camera) => (
              <CameraCard key={camera.id} camera={camera} roomName={room.name} path={path} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
