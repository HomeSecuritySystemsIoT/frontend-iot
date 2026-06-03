"use client"

import * as React from "react"
import { Video, VideoOff, Pencil, Trash2, Wifi } from "lucide-react"
import type { CameraSelect } from "@/drizzle/schema"
import {
  toggleCameraActive,
  toggleCameraMotionDetection,
  deleteCamera,
  updateCameraName,
} from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function useCameraFeed(deviceId: string | null, active: boolean) {
  const [frameSrc, setFrameSrc] = React.useState<string | null>(null)
  const prevUrl = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!deviceId || !active) return

    const backendWsUrl =
      process.env.NEXT_PUBLIC_BACKEND_WS_URL ??
      `ws://${window.location.hostname}:7890`
    const ws = new WebSocket(`${backendWsUrl}?device=${deviceId}`)
    ws.binaryType = "arraybuffer"

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: "image/jpeg" })
      const url = URL.createObjectURL(blob)
      setFrameSrc(url)
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
      prevUrl.current = url
    }

    ws.onclose = () => setFrameSrc(null)

    return () => {
      ws.close()
      if (prevUrl.current) URL.revokeObjectURL(prevUrl.current)
    }
  }, [deviceId, active])

  return frameSrc
}

function LiveBadge({ frameSrc }: { frameSrc: string | null }) {
  return (
    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-black/55 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white/90 border border-white/10 z-10">
      <span
        className={`size-1.5 rounded-full ${frameSrc ? "animate-pulse bg-red-500" : "bg-neutral-500"}`}
      />
      {frameSrc ? "LIVE" : "WAITING"}
    </div>
  )
}

function FeedDisplay({
  frameSrc,
  isActive,
  cameraName,
  className,
}: {
  frameSrc: string | null
  isActive: boolean
  cameraName: string
  className?: string
}) {
  if (!isActive) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 text-neutral-600 ${className}`}
      >
        <VideoOff className="size-8" />
        <span className="text-xs font-medium">Feed disabled</span>
      </div>
    )
  }

  if (frameSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={frameSrc}
        alt={`${cameraName} feed`}
        className={`absolute inset-0 h-full w-full object-cover ${className ?? ""}`}
      />
    )
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-neutral-500 ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)",
        }}
      />
      <Video className="size-8 relative" />
      <span className="text-xs font-medium relative">Waiting for device</span>
    </div>
  )
}

export function CameraCard({
  camera,
  roomName,
  path,
}: {
  camera: CameraSelect
  roomName: string
  path: string
}) {
  const [isActive, setIsActive] = React.useState(camera.isActive)
  const [motionDetection, setMotionDetection] = React.useState(
    camera.motionDetection
  )
  const [isPending, startTransition] = React.useTransition()
  const [zoomOpen, setZoomOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editName, setEditName] = React.useState(camera.name)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const frameSrc = useCameraFeed(camera.deviceId ?? null, isActive)

  function handleActiveChange(checked: boolean) {
    setIsActive(checked)
    startTransition(async () => {
      await toggleCameraActive(camera.id, checked, path)
    })
  }

  function handleMotionChange(checked: boolean) {
    setMotionDetection(checked)
    startTransition(async () => {
      await toggleCameraMotionDetection(camera.id, checked, path)
    })
  }

  function handleEditSave() {
    startTransition(async () => {
      await updateCameraName(camera.id, editName, path)
    })
    setEditOpen(false)
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteCamera(camera.id, path)
    })
  }

  return (
    <>
      {/* ── Card ── */}
      <div className="group/card bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
        {/* Thumbnail */}
        <div
          className="relative flex aspect-video items-center justify-center bg-neutral-950 cursor-pointer overflow-hidden"
          onClick={() => setZoomOpen(true)}
        >
          <FeedDisplay
            frameSrc={frameSrc}
            isActive={isActive}
            cameraName={camera.name}
          />

          {isActive && <LiveBadge frameSrc={frameSrc} />}

          {/* Hover overlay with Edit + Delete buttons */}
          <div
            className="absolute inset-0 bg-black/0 group-hover/card:bg-black/30 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-sm"
                className="bg-black/50 text-white hover:bg-black/70 hover:text-white border border-white/20"
                title="Edit camera"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditName(camera.name)
                  setEditOpen(true)
                }}
              >
                <Pencil className="size-3.5" />
              </Button>

              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-black/50 text-white hover:bg-red-600/80 hover:text-white border border-white/20"
                    title="Delete camera"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete camera</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove &quot;{camera.name}&quot; from
                      this room. The device will need to be re-paired to appear
                      again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div className="px-3.5 py-2.5">
          <p className="text-sm font-semibold truncate">{camera.name}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{roomName}</p>
        </div>
      </div>

      {/* ── Expanded view Dialog ── */}
      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <DialogContent
          showCloseButton
          className="sm:max-w-3xl p-0 overflow-hidden"
        >
          <div className="relative aspect-video bg-neutral-950 w-full">
            <FeedDisplay
              frameSrc={frameSrc}
              isActive={isActive}
              cameraName={camera.name}
              className="absolute inset-0"
            />
            {isActive && <LiveBadge frameSrc={frameSrc} />}
          </div>
          <div className="px-5 py-3.5 border-t border-border">
            <p className="font-semibold">{camera.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{roomName}</p>
            {camera.deviceId && (
              <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate">
                {camera.deviceId}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit camera</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="cam-name">Name</FieldLabel>
              <Input
                id="cam-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSave()
                }}
              />
            </Field>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm">
                <Wifi className="size-4 text-muted-foreground" />
                Feed active
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={handleActiveChange}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 text-sm">
                <Video className="size-4 text-muted-foreground" />
                Motion detection
              </div>
              <Switch
                checked={motionDetection}
                onCheckedChange={handleMotionChange}
                disabled={isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
