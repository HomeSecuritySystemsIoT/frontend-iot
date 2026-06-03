import { redirect } from "next/navigation"
import Link from "next/link"
import { Users, Home, ChevronRight, ShieldCheck } from "lucide-react"
import { getCurrentSession } from "@/lib/session"
import { getGroupsForUser } from "@/drizzle/actions/groups"
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb"
import { CreateDialog } from "@/components/create-dialog"
import { createGroup } from "@/app/dashboard/actions"
import { AdminDebugButton } from "@/components/admin-debug-button"
import { AppSidebar } from "@/components/app-sidebar"

export default async function DashboardPage() {
  const { user } = await getCurrentSession()
  if (!user) redirect("/auth/login")

  const isAdmin = user.email === process.env.ADMIN_EMAIL
  const userGroups = await getGroupsForUser(user.id)

  return (
    <>
      <AppSidebar />
      <main className="app-main">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card">
            <div>
              <DashboardBreadcrumb items={[{ label: "Dashboard" }]} />
              <h1 className="text-lg font-semibold tracking-tight mt-1.5">Your Groups</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a group to view its cameras.
              </p>
            </div>
            <CreateDialog
              title="Create a group"
              description="A group lets you manage houses and share access with other members."
              action={createGroup}
              triggerLabel="New group"
              submitLabel="Create group"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {isAdmin && (
              <div className="mb-8 p-5 bg-card rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="size-4 text-primary" />
                  <h2 className="text-sm font-semibold">All connected devices</h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Admin view — live feeds for every device currently connected to the gateway.
                </p>
                <AdminDebugButton />
              </div>
            )}

            {userGroups.length === 0 ? (
              <div className="mt-16 flex flex-col items-center gap-4 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/40">
                  <Users className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">No groups yet</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                    Create a group to start managing your security cameras.
                  </p>
                </div>
                <CreateDialog
                  title="Create a group"
                  description="A group lets you manage houses and share access with other members."
                  action={createGroup}
                  triggerLabel="Create your first group"
                  submitLabel="Create group"
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {userGroups.map((g) => (
                  <Link key={g.id} href={`/dashboard/${g.id}`}>
                    <div className="group flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/8 text-primary border border-primary/15">
                          <Home className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-none">{g.name}</p>
                          <p className="mt-1.5 text-xs text-muted-foreground capitalize">{g.role}</p>
                        </div>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
