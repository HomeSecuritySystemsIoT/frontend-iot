import { Suspense } from "react"
import { notFound, redirect } from "next/navigation"
import { Video, Camera } from "lucide-react"
import { getCurrentSession } from "@/lib/session"
import { getGroupById, isGroupMember } from "@/drizzle/actions/groups"
import { getHousesByGroupId } from "@/drizzle/actions/houses"
import { getRoomsWithCameraCount } from "@/drizzle/actions/rooms"
import { getCamerasByRoomId } from "@/drizzle/actions/cameras"
import { AccessDenied } from "@/components/access-denied"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { CameraCard } from "@/components/camera-card"
import { AddCameraDialog } from "@/components/add-camera-dialog"
import { Skeleton } from "@/components/ui/skeleton"

type Section = {
  houseId: number
  houseName: string
  roomId: number
  roomName: string
  cameras: Awaited<ReturnType<typeof getCamerasByRoomId>>
}

async function CameraGallery({
  groupId,
  roomIdFilter,
}: {
  groupId: number
  roomIdFilter: number | null
}) {
  const path = `/dashboard/${groupId}`

  const houses = await getHousesByGroupId(groupId)

  const sections: Section[] = []
  for (const house of houses) {
    const rooms = await getRoomsWithCameraCount(house.id)
    for (const room of rooms) {
      if (roomIdFilter !== null && room.id !== roomIdFilter) continue
      const cams = await getCamerasByRoomId(room.id)
      sections.push({
        houseId: house.id,
        houseName: house.name,
        roomId: room.id,
        roomName: room.name,
        cameras: cams,
      })
    }
  }

  const totalCameras = sections.reduce((n, s) => n + s.cameras.length, 0)

  if (sections.length === 0 && roomIdFilter === null) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
          <Video className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No cameras yet</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Add a house, then a room, then connect an ESP32-CAM to get started.
          </p>
        </div>
      </div>
    )
  }

  if (sections.length === 0 && roomIdFilter !== null) {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
          <Camera className="size-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">No cameras in this room</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            Flash an ESP32-CAM with your firmware to add it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.roomId}>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">{section.roomName}</h2>
              <p className="text-xs text-muted-foreground">{section.houseName}</p>
            </div>
            <AddCameraDialog roomId={section.roomId} groupId={groupId} />
          </div>

          {/* Camera grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {section.cameras.map((camera) => (
              <CameraCard
                key={camera.id}
                camera={camera}
                roomName={section.roomName}
                path={path}
              />
            ))}
          </div>
        </div>
      ))}

      <p className="text-xs text-muted-foreground pb-2">
        {totalCameras} {totalCameras === 1 ? "camera" : "cameras"} total
      </p>
    </div>
  )
}

function CameraGallerySkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1].map((i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2].map((j) => (
              <div key={j} className="rounded-xl border border-border overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="px-3.5 py-2.5 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function GroupGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>
  searchParams: Promise<{ room?: string }>
}) {
  const { user } = await getCurrentSession()
  if (!user) redirect("/auth/login")

  const { groupId: groupIdStr } = await params
  const groupId = Number(groupIdStr)
  if (isNaN(groupId)) notFound()

  const { room: roomStr } = await searchParams
  const roomIdFilter = roomStr ? Number(roomStr) : null

  const [group, member] = await Promise.all([
    getGroupById(groupId),
    isGroupMember(groupId, user.id),
  ])

  if (!group) notFound()
  if (!member) return <AccessDenied />

  const breadcrumbItems = roomIdFilter
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: group.name, href: `/dashboard/${groupId}` },
        { label: "Room filter" },
      ]
    : [
        { label: "Dashboard", href: "/dashboard" },
        { label: group.name },
      ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
        <div>
          <DashboardBreadcrumb items={breadcrumbItems} />
          <h1 className="text-lg font-semibold tracking-tight mt-1.5">
            {group.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roomIdFilter ? "Filtered by room" : "All cameras"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <Suspense fallback={<CameraGallerySkeleton />}>
          <CameraGallery groupId={groupId} roomIdFilter={roomIdFilter} />
        </Suspense>
      </div>
    </div>
  )
}
