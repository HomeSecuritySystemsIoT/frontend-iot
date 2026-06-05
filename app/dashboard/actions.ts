"use server"

import { revalidatePath } from "next/cache"
import { getCurrentSession } from "@/lib/session"
import { createGroupRecord } from "@/drizzle/actions/groups"
import { createHouseRecord } from "@/drizzle/actions/houses"
import { createRoomRecord } from "@/drizzle/actions/rooms"
import {
  setCameraActive,
  setCameraMotionDetection,
} from "@/drizzle/actions/cameras"
import { createClaimToken } from "@/drizzle/actions/claimTokens"

// ── Group ─────────────────────────────────────────────────────────────────────

export type CreateState = { error?: string; success?: boolean } | null

export async function createGroup(
  _prevState: CreateState,
  formData: FormData
): Promise<CreateState> {
  const { user } = await getCurrentSession()
  if (!user) return { error: "Not authenticated." }

  const name = (formData.get("name") as string)?.trim()
  if (!name) return { error: "Name is required." }

  const group = await createGroupRecord(name, user.id)
  if (!group) return { error: "Failed to create group." }

  revalidatePath("/dashboard")
  return { success: true }
}

// ── House ─────────────────────────────────────────────────────────────────────

export async function createHouse(
  _prevState: CreateState,
  formData: FormData
): Promise<CreateState> {
  const { user } = await getCurrentSession()
  if (!user) return { error: "Not authenticated." }

  const groupId = Number(formData.get("groupId"))
  const name = (formData.get("name") as string)?.trim()
  const address = (formData.get("address") as string)?.trim()

  if (!name) return { error: "Name is required." }

  const house = await createHouseRecord(groupId, name, address || undefined)
  if (!house) return { error: "Failed to create house." }

  revalidatePath("/dashboard")
  return { success: true }
}

// ── Room ──────────────────────────────────────────────────────────────────────

export async function createRoom(
  _prevState: CreateState,
  formData: FormData
): Promise<CreateState> {
  const { user } = await getCurrentSession()
  if (!user) return { error: "Not authenticated." }

  const houseId = Number(formData.get("houseId"))
  const name = (formData.get("name") as string)?.trim()

  if (!name) return { error: "Name is required." }

  const room = await createRoomRecord(houseId, name)
  if (!room) return { error: "Failed to create room." }

  revalidatePath("/dashboard")
  return { success: true }
}

// ── Admin: connected devices ──────────────────────────────────────────────────

export async function fetchConnectedDevices(): Promise<{
  devices?: string[]
  error?: string
}> {
  try {
    const backendUrl = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:7890"
    const res = await fetch(`${backendUrl}/devices`, {
      cache: "no-store",
    })
    const text = await res.text()
    console.log("[admin] GET /devices →", res.status, text)
    if (!res.ok) return { error: `HTTP ${res.status}` }
    const data = JSON.parse(text)
    return { devices: data.devices ?? [] }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log("[admin] GET /devices failed:", msg)
    return { error: msg }
  }
}

// ── Camera toggles ────────────────────────────────────────────────────────────

export async function toggleCameraActive(
  cameraId: number,
  isActive: boolean,
  path: string
): Promise<void> {
  await setCameraActive(cameraId, isActive)
  revalidatePath(path)
}

export async function toggleCameraMotionDetection(
  cameraId: number,
  motionDetection: boolean,
  path: string
): Promise<void> {
  await setCameraMotionDetection(cameraId, motionDetection)
  revalidatePath(path)
}

// ── Camera claiming ───────────────────────────────────────────────────────────

export async function createClaimTokenAction(
  groupId: number,
  roomId: number
): Promise<{ token: string; expiresAt: string }> {
  const { user } = await getCurrentSession()
  if (!user) throw new Error("Not authenticated")
  const token = await createClaimToken(groupId, roomId, user.id)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  return { token, expiresAt }
}
