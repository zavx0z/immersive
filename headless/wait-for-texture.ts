import type {TextureLease} from "@zavx0z/immersive-webgpu"

/** Временная подписка принадлежит только ожидающему кадру и не сохраняет texture после завершения. */
export default function waitForTexture(input: Readonly<{
  device: GPUDevice
  signal: AbortSignal
  acquire(changed: () => void): Pick<TextureLease, "load" | "peek" | "release">
}>): Promise<void> {
  return new Promise((resolve, reject) => {
    let lease: ReturnType<typeof input.acquire> | undefined
    let finished = false
    const finish = (error?: unknown): void => {
      if (finished) return
      finished = true
      input.signal.removeEventListener("abort", aborted)
      lease?.release()
      error === undefined ? resolve() : reject(error)
    }
    const changed = (): void => {
      if (finished) return
      const entry = lease?.peek(input.device)
      if (entry?.status === "failed") finish(new Error("Headless не смог загрузить изображение", {cause: entry.error}))
      else if (entry?.status === "ready") finish()
    }
    const aborted = (): void => finish(input.signal.reason ?? new DOMException("Ожидание изображения отменено", "AbortError"))
    if (input.signal.aborted) {
      aborted()
      return
    }
    try {
      lease = input.acquire(changed)
      if (input.signal.aborted) {
        aborted()
        return
      }
      input.signal.addEventListener("abort", aborted, {once: true})
      lease.load(input.device)
      changed()
    } catch (error) { finish(error) }
  })
}
