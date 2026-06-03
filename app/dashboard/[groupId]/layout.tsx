import { notFound, redirect } from "next/navigation"
import { getCurrentSession } from "@/lib/session"
import { getGroupById, getGroupsForUser } from "@/drizzle/actions/groups"
import { getHousesByGroupId } from "@/drizzle/actions/houses"
import { getRoomsWithCameraCount } from "@/drizzle/actions/rooms"
import { AccessDenied } from "@/components/access-denied"
import { GroupSidebar } from "@/components/group-sidebar"

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ groupId: string }>
}) {
  const { user } = await getCurrentSession()
  if (!user) redirect("/auth/login")

  const { groupId: groupIdStr } = await params
  const groupId = Number(groupIdStr)
  if (isNaN(groupId)) notFound()

  const [group, userGroups] = await Promise.all([
    getGroupById(groupId),
    getGroupsForUser(user.id),
  ])

  if (!group) notFound()

  const membership = userGroups.find((g) => g.id === groupId)
  if (!membership) return <AccessDenied />

  const houses = await getHousesByGroupId(groupId)

  const housesWithRooms = await Promise.all(
    houses.map(async (house) => {
      const rooms = await getRoomsWithCameraCount(house.id)
      return {
        id: house.id,
        name: house.name,
        rooms: rooms.map((r) => ({
          id: r.id,
          name: r.name,
          cameraCount: r.cameraCount,
        })),
      }
    })
  )

  const allGroups = userGroups.map((g) => ({
    id: g.id,
    name: g.name,
    role: g.role,
  }))

  return (
    <>
      <GroupSidebar
        groupId={groupId}
        groupName={group.name}
        userRole={membership.role}
        userEmail={user.email}
        houses={housesWithRooms}
        allGroups={allGroups}
      />
      <main className="app-main">{children}</main>
    </>
  )
}
