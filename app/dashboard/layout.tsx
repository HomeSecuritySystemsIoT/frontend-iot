import React, { Suspense } from "react"
import { getCurrentSession } from "@/lib/session"
import { getGroupsForUser } from "@/drizzle/actions/groups"
import { getHousesByGroupId } from "@/drizzle/actions/houses"
import { getRoomsWithCameraCount } from "@/drizzle/actions/rooms"
import { AppSidebar } from "@/components/app-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getCurrentSession()

  let hierarchy: {
    id: number
    name: string
    role: string
    houses: {
      id: number
      name: string
      address: string | null
      groupId: number
      rooms: { id: number; name: string; houseId: number; cameraCount: number }[]
    }[]
  }[] = []

  if (user) {
    const groups = await getGroupsForUser(user.id)
    hierarchy = await Promise.all(
      groups.map(async (g) => {
        const houseList = await getHousesByGroupId(g.id)
        const houses = await Promise.all(
          houseList.map(async (h) => {
            const rooms = await getRoomsWithCameraCount(h.id)
            return {
              id: h.id,
              name: h.name,
              address: h.address,
              groupId: h.groupId,
              rooms: rooms.map((r) => ({
                id: r.id,
                name: r.name,
                houseId: r.houseId,
                cameraCount: r.cameraCount,
              })),
            }
          })
        )
        return { id: g.id, name: g.name, role: g.role, houses }
      })
    )
  }

  return (
    <div className="app-shell">
      <Suspense>
        <AppSidebar hierarchy={hierarchy} />
      </Suspense>
      <main className="app-main">{children}</main>
    </div>
  )
}
