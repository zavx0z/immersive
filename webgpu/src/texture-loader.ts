import {GifAnimation, type GifDecoderConstructor} from "./gif-animation.ts"

type ExternalImageSource = Parameters<GPUQueue["copyExternalImageToTexture"]>[0]["source"]

export type TextureStatus = "loading" | "ready" | "failed"

export interface TextureEntry {
  src: string
  status: TextureStatus
  width: number
  height: number
  texture: GPUTexture | null
  error: unknown
  device?: GPUDevice
  pendingBitmap?: ImageBitmap | undefined
  pendingExternalSource?: PendingExternalSource | undefined
  externalTextureSource?: GPUExternalTextureDescriptor["source"] | undefined
  externalTexturePool?: ExternalTexturePool | undefined
}

const cache = new Map<string, TextureEntry>()
const entriesBySource = new Map<string, Set<TextureEntry>>()
const deviceEntries = new WeakMap<GPUDevice, Map<string, TextureEntry>>()
const leases = new Map<string, Map<() => void, LeaseState>>()
const states = new WeakMap<TextureEntry, EntryState>()
const inactive = new Map<TextureEntry, number>()
const reservations = new Map<TextureEntry, number>()
const sources = new Map<string, {bitmap?: ImageBitmap; external?: PendingExternalSource; video?: HTMLVideoElement; width: number; height: number}>()
const fallbackTextures = new WeakMap<GPUDevice, GPUTexture>()
const MAX_INACTIVE_BYTES = 32 * 1024 * 1024
const MAX_INACTIVE_ENTRIES = 128
let inactiveBytes = 0

type EntryState = {owners: Set<LeaseState>; generation: number; abort: AbortController; disposed: boolean; animation?: GifAnimation; gifBytes: number; producerPending: boolean}
type LeaseState = {src: string; callback: () => void; entries: Set<TextureEntry>; provisional?: TextureEntry; visible: boolean; released: boolean}

/** Потребитель источника; GPUDevice выбирается при load. release идемпотентен. */
export type TextureLease = Readonly<{
  load(device: GPUDevice): TextureEntry
  peek(device?: GPUDevice): TextureEntry | undefined
  setVisible(visible: boolean): void
  release(): void
}>

function entryBytes(entry: TextureEntry): number {
  const gpu = entry.externalTexturePool?.textures.length ?? Number(entry.texture !== null)
  const bitmap = entry.pendingBitmap === undefined ? 0 : Math.max(1, entry.pendingBitmap.width) * Math.max(1, entry.pendingBitmap.height) * 4
  const pending = entry.pendingExternalSource === undefined ? 0 : entry.pendingExternalSource.width * entry.pendingExternalSource.height * 4
  const producer = sources.get(entry.src)
  const retained = producer?.bitmap === undefined ? 0 : producer.bitmap.width * producer.bitmap.height * 4
  return entry.src.length * 2 + entry.width * entry.height * 4 * gpu + Math.max(bitmap, retained) + pending + (states.get(entry)?.gifBytes ?? 0)
}
function producerCapacity(src: string, bytes: number): void {
  if (leases.get(src)?.size) return
  const previous = [...reservations].filter(([entry]) => entry.src !== src)
  const regular = previous.reduce((sum, [, size]) => sum + (size <= MAX_INACTIVE_BYTES ? size : 0), 0)
  if (previous.length >= MAX_INACTIVE_ENTRIES || bytes > MAX_INACTIVE_BYTES && previous.some(([, size]) => size > MAX_INACTIVE_BYTES) ||
    bytes <= MAX_INACTIVE_BYTES && regular + bytes > MAX_INACTIVE_BYTES) throw new Error("Pending texture producers exceed handoff budget; acquire a lease before publishing")
}
function reserveProducer(entry: TextureEntry): void {
  const state = states.get(entry)!
  state.producerPending = state.owners.size === 0
  if (state.producerPending) {
    removeInactive(entry)
    reservations.set(entry, entryBytes(entry))
  }
}
function consumeProducer(entry: TextureEntry): void {
  states.get(entry)!.producerPending = false
  reservations.delete(entry)
}
function removeInactive(entry: TextureEntry): void {
  const bytes = inactive.get(entry)
  if (bytes === undefined) return
  inactiveBytes -= bytes
  inactive.delete(entry)
}
function alive(entry: TextureEntry, generation?: number): boolean {
  const state = states.get(entry)
  return state !== undefined && !state.disposed && (generation === undefined || generation === state.generation)
}
function destroyEntry(entry: TextureEntry): void {
  const state = states.get(entry)
  if (state === undefined || state.disposed) return
  state.disposed = true
  state.generation++
  state.abort.abort()
  state.animation?.stop()
  delete state.animation
  state.gifBytes = 0
  reservations.delete(entry)
  removeInactive(entry)
  if (entry.pendingBitmap !== sources.get(entry.src)?.bitmap) entry.pendingBitmap?.close?.()
  delete entry.pendingBitmap
  const pending = entry.pendingExternalSource
  if (pending?.closeSourceAfterCopy) closeExternalSource(pending.source)
  delete entry.pendingExternalSource
  delete entry.externalTextureSource
  destroyExternalTexturePool(entry)
  entry.texture?.destroy()
  entry.texture = null
  if (entry.device !== undefined) deviceEntries.get(entry.device)?.delete(entry.src)
  const entries = entriesBySource.get(entry.src)
  entries?.delete(entry)
  if (entries?.size === 0) {
    entriesBySource.delete(entry.src)
    sources.get(entry.src)?.bitmap?.close?.()
    sources.delete(entry.src)
  }
  if (cache.get(entry.src) === entry) {
    const other = entries?.values().next().value
    if (other === undefined) cache.delete(entry.src)
    else cache.set(entry.src, other)
  }
}
function trimInactive(): void {
  while (inactiveBytes > MAX_INACTIVE_BYTES || inactive.size > MAX_INACTIVE_ENTRIES) {
    const oldest = inactive.keys().next().value
    if (oldest === undefined) break
    destroyEntry(oldest)
  }
}
function settle(entry: TextureEntry): void {
  const state = states.get(entry)
  if (state === undefined || state.disposed || state.owners.size !== 0) return
  if (state.producerPending) {
    reservations.set(entry, entryBytes(entry))
    return
  }
  state.animation?.stop()
  if (entry.status === "failed") {
    destroyEntry(entry)
    return
  }
  if (entry.status === "loading" && entry.device !== undefined) {
    destroyEntry(entry)
    return
  }
  removeInactive(entry)
  const bytes = entryBytes(entry)
  inactive.set(entry, bytes)
  inactiveBytes += bytes
  trimInactive()
}
function animate(entry: TextureEntry): void {
  const state = states.get(entry)
  if (state?.owners.size && [...state.owners].some(owner => owner.visible)) state.animation?.start()
  else state?.animation?.pause()
}
function bind(owner: LeaseState, entry: TextureEntry): void {
  if (owner.released || !alive(entry)) return
  consumeProducer(entry)
  for (const previous of owner.entries) if (!alive(previous)) owner.entries.delete(previous)
  if (owner.provisional !== undefined && owner.provisional !== entry) {
    const previous = owner.provisional
    owner.entries.delete(previous)
    states.get(previous)?.owners.delete(owner)
    animate(previous)
    settle(previous)
  }
  delete owner.provisional
  owner.entries.add(entry)
  states.get(entry)!.owners.add(owner)
  removeInactive(entry)
  animate(entry)
}
function register(entry: TextureEntry): TextureEntry {
  states.set(entry, {owners: new Set(), generation: 0, abort: new AbortController(), disposed: false, gifBytes: 0, producerPending: false})
  let entries = entriesBySource.get(entry.src)
  if (entries === undefined) {
    entries = new Set()
    entriesBySource.set(entry.src, entries)
  }
  entries.add(entry)
  cache.set(entry.src, entry)
  if (entry.device !== undefined) {
    let owned = deviceEntries.get(entry.device)
    if (owned === undefined) {
      owned = new Map()
      deviceEntries.set(entry.device, owned)
    }
    owned.set(entry.src, entry)
  }
  for (const owner of leases.get(entry.src)?.values() ?? []) if (owner.entries.size === 0) {
    bind(owner, entry)
    owner.provisional = entry
  }
  return entry
}
function restartSource(entry: TextureEntry): void {
  const state = states.get(entry)!
  state.generation++
  state.abort.abort()
  state.abort = new AbortController()
  state.animation?.stop()
  delete state.animation
  state.gifBytes = 0
}

export type PendingExternalSource = {
  source: ExternalImageSource
  width: number
  height: number
  bufferCount: number
  closeSourceAfterCopy: boolean
}

export type ReplaceExternalSourceOptions = {
  keepPending?: boolean
  bufferCount?: number
  closeSourceAfterCopy?: boolean
}

export type ExternalTexturePool = {
  width: number
  height: number
  textures: GPUTexture[]
  nextIndex: number
}

export class TextureLoader {
  /** Получает lease одного потребителя; повтор той же callback не увеличивает ownership. */
  static acquire(src: string, callback: () => void, options: Readonly<{animate?: boolean}> = {}): TextureLease {
    let source = leases.get(src)
    if (source === undefined) {
      source = new Map()
      leases.set(src, source)
    }
    let owner = source.get(callback)
    if (owner === undefined) {
      owner = {src, callback, entries: new Set(), visible: options.animate !== false, released: false}
      source.set(callback, owner)
      const current = cache.get(src)
      if (current !== undefined) {
        bind(owner, current)
        owner.provisional = current
      }
    }
    const selected = owner
    return {
      load(device) {
        if (selected.released) throw new Error("Texture lease is released")
        const entry = TextureLoader.load(device, src)
        bind(selected, entry)
        return entry
      },
      peek(device) {return TextureLoader.peek(src, device)},
      setVisible(visible) {
        if (selected.released) return
        selected.visible = visible
        for (const entry of selected.entries) animate(entry)
      },
      release() {
        if (selected.released) return
        selected.released = true
        source!.delete(callback)
        if (source!.size === 0 && leases.get(src) === source) leases.delete(src)
        for (const entry of selected.entries) {
          states.get(entry)?.owners.delete(selected)
          animate(entry)
          settle(entry)
        }
        selected.entries.clear()
        delete selected.provisional
      },
    }
  }
  static addChangeListener(src: string, callback: () => void, options: Readonly<{animate?: boolean}> = {}): void {
    TextureLoader.acquire(src, callback, options)
  }
  static setAnimationVisible(src: string, callback: () => void, visible: boolean): void {
    const owner = leases.get(src)?.get(callback)
    if (owner === undefined) return
    owner.visible = visible
    for (const entry of owner.entries) animate(entry)
  }
  static removeChangeListener(src: string, callback: () => void): void {
    const owner = leases.get(src)?.get(callback)
    if (owner !== undefined) TextureLoader.acquire(src, callback).release()
  }
  /** Binding уже зарегистрированного потребителя; сам вызов не приобретает ownership. */
  static bindChangeListener(src: string, callback: () => void, device: GPUDevice): boolean {
    const owner = leases.get(src)?.get(callback)
    const entry = deviceEntries.get(device)?.get(src)
    if (owner === undefined || entry === undefined) return false
    bind(owner, entry)
    return true
  }
  static status(src: string, device?: GPUDevice): TextureStatus | "idle" {return TextureLoader.peek(src, device)?.status ?? "idle"}
  static peek(src: string, device?: GPUDevice): TextureEntry | undefined {return device === undefined ? cache.get(src) : deviceEntries.get(device)?.get(src)}

  /** Повторное чтение не создаёт lease; GPU-ресурс принадлежит ровно этому device. */
  static load(device: GPUDevice, src: string, onChange?: () => void): TextureEntry {
    if (onChange !== undefined) TextureLoader.acquire(src, onChange)
    let entry = deviceEntries.get(device)?.get(src)
    if (entry === undefined) {
      const pending = cache.get(src)
      if (pending?.device === undefined && pending !== undefined) {
        entry = pending
        entry.device = device
        let owned = deviceEntries.get(device)
        if (owned === undefined) {
          owned = new Map()
          deviceEntries.set(device, owned)
        }
        owned.set(src, entry)
      } else entry = register({src, status: "loading", width: 1, height: 1, texture: null, error: null, device})
      const loading = entry
      consumeProducer(loading)
      const generation = states.get(loading)!.generation
      queueMicrotask(() => {
        if (!alive(loading, generation)) return
        const producer = sources.get(src)
        if (producer?.video !== undefined) {
          loading.externalTextureSource = producer.video
          loading.width = producer.width
          loading.height = producer.height
        } else if (producer?.external !== undefined) loading.pendingExternalSource = producer.external
        else if (producer?.bitmap !== undefined) loading.pendingBitmap = producer.bitmap
        if (loading.externalTextureSource !== undefined) {
          loading.status = "ready"
          notify(src, loading)
          settle(loading)
        }
        else if (loading.pendingExternalSource !== undefined) replaceTextureFromExternalSource(device, loading, loading.pendingExternalSource)
        else if (loading.pendingBitmap !== undefined) void replaceTextureFromBitmap(device, loading, loading.pendingBitmap, loading.pendingBitmap !== producer?.bitmap).catch(() => {})
        else if (!isVirtualTextureSrc(src)) void loadTexture(device, loading)
      })
    }
    if (onChange !== undefined) bind(leases.get(src)!.get(onChange)!, entry)
    // lease.load calls this without onChange and binds synchronously before the microtask.
    if (entry.status !== "loading") {
      if (inactive.has(entry)) {
        removeInactive(entry)
        settle(entry)
      }
      animate(entry)
    }
    return entry
  }

  /** Bitmap ownership передаётся загрузчику; replacement отзывает прежнюю загрузку. */
  static replaceBitmap(src: string, bitmap: ImageBitmap): void {
    producerCapacity(src, src.length * 2 + bitmap.width * bitmap.height * 4)
    const oldSource = sources.get(src)
    sources.set(src, {bitmap, width: bitmap.width, height: bitmap.height})
    const entries = [...entriesBySource.get(src) ?? []]
    if (!entries.length) entries.push(register({src, status: "loading", width: bitmap.width || 1, height: bitmap.height || 1, texture: null, error: null}))
    const previous = new Set<ImageBitmap>()
    const external = new Set<ExternalImageSource>()
    for (const entry of entries) if (entry.pendingExternalSource?.closeSourceAfterCopy) external.add(entry.pendingExternalSource.source)
    for (const source of external) closeExternalSource(source)
    for (const entry of entries) if (entry.pendingBitmap !== undefined && entry.pendingBitmap !== bitmap) previous.add(entry.pendingBitmap)
    if (oldSource?.bitmap !== undefined && oldSource.bitmap !== bitmap) previous.add(oldSource.bitmap)
    for (const old of previous) old.close?.()
    const updates: Promise<void>[] = []
    for (const entry of entries) {
      restartSource(entry)
      entry.pendingBitmap = bitmap
      delete entry.pendingExternalSource
      delete entry.externalTextureSource
      reserveProducer(entry)
      if (entry.device === undefined) {
        entry.status = "loading"
        notify(src, entry)
        settle(entry)
      }
      else updates.push(replaceTextureFromBitmap(entry.device, entry, bitmap, false))
    }
    if (updates.length) void Promise.allSettled(updates)
  }

  static replaceExternalSource(src: string, source: ExternalImageSource, width: number, height: number, options: ReplaceExternalSourceOptions = {}): boolean {
    producerCapacity(src, src.length * 2 + Math.max(1, width) * Math.max(1, height) * 4)
    const entries = [...entriesBySource.get(src) ?? []]
    const pending: PendingExternalSource = {source, width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)),
      bufferCount: Math.max(1, Math.round(options.bufferCount ?? 1)), closeSourceAfterCopy: options.closeSourceAfterCopy === true}
    const liveVideo = liveVideoElementSource(source)
    const oldBitmap = sources.get(src)?.bitmap
    oldBitmap?.close?.()
    sources.set(src, {width: pending.width, height: pending.height,
      ...(liveVideo === undefined ? {} : {video: liveVideo}),
      ...(liveVideo === undefined && !pending.closeSourceAfterCopy && options.keepPending !== false ? {external: pending} : {})})
    if (!entries.length) entries.push(register({src, status: "loading", width: pending.width, height: pending.height, texture: null, error: null}))
    let copied = false
    const previous = new Set<ExternalImageSource>()
    for (const entry of entries) if (entry.pendingExternalSource?.closeSourceAfterCopy && entry.pendingExternalSource.source !== source) previous.add(entry.pendingExternalSource.source)
    for (const old of previous) closeExternalSource(old)
    for (const entry of entries) {
      restartSource(entry)
      if (entry.pendingBitmap !== oldBitmap) entry.pendingBitmap?.close?.()
      delete entry.pendingBitmap
      reserveProducer(entry)
      if (liveVideo !== undefined) {
        destroyExternalTexturePool(entry)
        entry.texture?.destroy()
        entry.texture = null
        delete entry.pendingExternalSource
        entry.externalTextureSource = liveVideo
        entry.width = pending.width
        entry.height = pending.height
        entry.status = "ready"
        entry.error = null
        notify(src, entry)
        settle(entry)
        copied = true
      } else {
        delete entry.externalTextureSource
        if (entry.device === undefined) {
          if (options.keepPending !== false) entry.pendingExternalSource = pending
          entry.status = "loading"; notify(src, entry)
        settle(entry)
        } else {
          replaceTextureFromExternalSource(entry.device, entry, {...pending, closeSourceAfterCopy: false})
          copied ||= entry.status === "ready"
        }
      }
    }
    if (pending.closeSourceAfterCopy && !entries.some(entry => entry.pendingExternalSource?.source === source)) {
      const devices = new Set(entries.flatMap(entry => entry.device === undefined ? [] : [entry.device]))
      void Promise.allSettled([...devices].map(device => device.queue.onSubmittedWorkDone())).finally(() => closeExternalSource(source))
    }
    return copied
  }
  /** Освобождает terminal device; borrowed consumers должны освобождать только свои leases. */
  static disposeDevice(device: GPUDevice): void {
    for (const entry of deviceEntries.get(device)?.values() ?? []) destroyEntry(entry)
    deviceEntries.delete(device)
    fallbackTextures.get(device)?.destroy()
    fallbackTextures.delete(device)
  }
  /** Отзывает ещё не потреблённый producer handoff, не повреждая живые leases. */
  static releaseSource(src: string): void {
    for (const entry of entriesBySource.get(src) ?? []) if (states.get(entry)?.producerPending) {
      consumeProducer(entry)
      destroyEntry(entry)
    }
  }
  /** Отзывает decoder Browser и все удержанные GPU-представления его уникального source. */
  static releaseVideoSource(src: string): void {
    for (const entry of [...entriesBySource.get(src) ?? []]) destroyEntry(entry)
    sources.delete(src)
  }
  static diagnostics(): Readonly<{activeEntries: number; inactiveEntries: number; inactiveBytes: number; pendingLoads: number; pendingProducerEntries: number; pendingProducerBytes: number}> {
    let activeEntries = 0
    let pendingLoads = 0
    for (const entries of entriesBySource.values()) for (const entry of entries) {
      if (states.get(entry)?.owners.size) activeEntries++
      if (entry.status === "loading") pendingLoads++
    }
    return {activeEntries, inactiveEntries: inactive.size, inactiveBytes, pendingLoads,
      pendingProducerEntries: reservations.size, pendingProducerBytes: [...reservations.values()].reduce((sum, bytes) => sum + bytes, 0)}
  }
  /** Возвращает прозрачную текстуру, принадлежащую именно запрошенному устройству. */
  static fallback(device: GPUDevice): GPUTexture {
    const existing = fallbackTextures.get(device)
    if (existing) return existing
    const fallbackTexture = device.createTexture({
      label: "TextureLoader.fallbackTransparent",
      size: { width: 1, height: 1 },
      format: "rgba8unorm",
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    })
    device.queue.writeTexture(
      { texture: fallbackTexture },
      new Uint8Array([255, 255, 255, 0]),
      { bytesPerRow: 4, rowsPerImage: 1 },
      { width: 1, height: 1 },
    )
    fallbackTextures.set(device, fallbackTexture)
    return fallbackTexture
  }
}

function liveVideoElementSource(source: ExternalImageSource): HTMLVideoElement | undefined {
  return typeof HTMLVideoElement !== "undefined" && source instanceof HTMLVideoElement
    ? source
    : undefined
}

async function loadTexture(device: GPUDevice, entry: TextureEntry): Promise<void> {
  const generation = states.get(entry)!.generation
  try {
    if (isVirtualTextureSrc(entry.src)) return
    const pending = entry.pendingBitmap
    if (pending !== undefined) {
      await replaceTextureFromBitmap(device, entry, pending)
      return
    }
    const response = await fetch(entry.src, {signal: states.get(entry)!.abort.signal})
    if (!alive(entry, generation)) return
    if (!response.ok) throw new Error(`HTTP ${response.status} while loading ${entry.src}`)
    const blob = await response.blob()
    const signature = await blob.slice(0, 6).text()
    if (!alive(entry, generation)) return
    if (signature === "GIF87a" || signature === "GIF89a") {
      const Decoder = (globalThis as unknown as {ImageDecoder?: GifDecoderConstructor}).ImageDecoder
      if (Decoder !== undefined && await Decoder.isTypeSupported("image/gif")) {
        const data = await blob.arrayBuffer()
        if (!alive(entry, generation)) return
        const animation = new GifAnimation({
          createDecoder: () => new Decoder({type: "image/gif", data, preferAnimation: true}),
          observed: () => [...states.get(entry)!.owners].some(owner => owner.visible),
          present(frame) {
            if (!alive(entry, generation)) return
            replaceTextureFromExternalSource(entry.device ?? device, entry, {
              source: frame,
              width: frame.displayWidth,
              height: frame.displayHeight,
              bufferCount: 1,
              closeSourceAfterCopy: false,
            })
            if (entry.status === "failed") throw entry.error
            if (states.get(entry)!.owners.size === 0) animation.stop()
          },
          failed(error) {
            if (!alive(entry, generation)) return
            entry.error = error
            entry.status = "failed"
            console.warn("[TextureLoader] failed to animate GIF:", entry.src, error)
            notify(entry.src, entry)
          },
        })
        states.get(entry)!.animation = animation
        states.get(entry)!.gifBytes = data.byteLength
        animation.start()
        return
      }
      console.warn("[TextureLoader] GIF animation requires ImageDecoder; showing a static frame:", entry.src)
    }
    const bitmap = await decodeBitmap(blob)
    if (!alive(entry, generation)) {
      bitmap.close?.()
      return
    }
    await replaceTextureFromBitmap(device, entry, bitmap)
  } catch (err) {
    if (!alive(entry, generation)) return
    entry.status = "failed"
    entry.error = err
    console.warn("[TextureLoader] failed to load texture:", entry.src, err)
  } finally {
    if (alive(entry, generation)) {
      notify(entry.src, entry)
      settle(entry)
    }
  }
}

function isVirtualTextureSrc(src: string): boolean {
  return src.startsWith("metafor:")
}

async function replaceTextureFromBitmap(device: GPUDevice, entry: TextureEntry, bitmap: ImageBitmap, closeAfter = true): Promise<void> {
  if (!alive(entry)) {
    if (closeAfter) bitmap.close?.()
    return
  }
  entry.status = "loading"
  entry.device = device
  destroyExternalTexturePool(entry)
  delete entry.externalTextureSource
  try {
    const width = Math.max(1, bitmap.width)
    const height = Math.max(1, bitmap.height)
    let texture = entry.texture
    if (texture === null || entry.width !== width || entry.height !== height) {
      texture?.destroy()
      texture = device.createTexture({
        label: `TextureLoader:${entry.src}`,
        size: {width, height},
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })
      entry.texture = texture
    }
    device.queue.copyExternalImageToTexture(
      {source: bitmap},
      {texture},
      {width, height},
    )
    entry.width = width
    entry.height = height
    if (entry.pendingBitmap === bitmap) delete entry.pendingBitmap
    entry.error = null
    entry.status = "ready"
  } catch (err) {
    entry.status = "failed"
    entry.error = err
    destroyExternalTexturePool(entry)
    entry.texture?.destroy()
    entry.texture = null
    throw err
  } finally {
    if (closeAfter) bitmap.close?.()
    if (entry.pendingBitmap === bitmap) delete entry.pendingBitmap
    notify(entry.src, entry)
    settle(entry)
  }
}

function replaceTextureFromExternalSource(
  device: GPUDevice,
  entry: TextureEntry,
  pending: PendingExternalSource,
): void {
  if (!alive(entry)) {
    if (pending.closeSourceAfterCopy) closeExternalSource(pending.source)
    return
  }
  entry.status = "loading"
  entry.device = device
  try {
    const width = Math.max(1, pending.width)
    const height = Math.max(1, pending.height)
    const texture = pending.bufferCount > 1
      ? nextBufferedExternalTexture(device, entry, width, height, pending.bufferCount)
      : singleExternalTexture(device, entry, width, height)
    device.queue.copyExternalImageToTexture(
      {source: pending.source},
      {texture},
      {width, height},
    )
    entry.width = width
    entry.height = height
    entry.error = null
    entry.status = "ready"
  } catch (err) {
    entry.status = "failed"
    entry.error = err
    destroyExternalTexturePool(entry)
    entry.texture?.destroy()
    entry.texture = null
    if (pending.closeSourceAfterCopy) closeExternalSource(pending.source)
    console.warn("[TextureLoader] failed to copy external texture source:", entry.src, err)
  } finally {
    if (pending.closeSourceAfterCopy && entry.status === "ready") {
      void device.queue.onSubmittedWorkDone().finally(() => closeExternalSource(pending.source))
    }
    if (entry.pendingExternalSource === pending) delete entry.pendingExternalSource
    notify(entry.src, entry)
    settle(entry)
  }
}

function closeExternalSource(source: ExternalImageSource): void {
  const close = (source as {close?: unknown}).close
  if (typeof close !== "function") return
  try {
    close.call(source)
  } catch {
    // Ignore double-close or browser-specific VideoFrame lifecycle errors.
  }
}

function singleExternalTexture(device: GPUDevice, entry: TextureEntry, width: number, height: number): GPUTexture {
  destroyExternalTexturePool(entry)
  let texture = entry.texture
  if (texture === null || entry.width !== width || entry.height !== height) {
    texture?.destroy()
    texture = createExternalTexture(device, entry.src, width, height)
    entry.texture = texture
  }
  return texture
}

function nextBufferedExternalTexture(
  device: GPUDevice,
  entry: TextureEntry,
  width: number,
  height: number,
  bufferCount: number,
): GPUTexture {
  let pool = entry.externalTexturePool
  if (pool === undefined || pool.width !== width || pool.height !== height || pool.textures.length !== bufferCount) {
    destroyExternalTexturePool(entry)
    entry.texture?.destroy()
    entry.texture = null
    pool = {
      width,
      height,
      textures: Array.from({length: bufferCount}, () => createExternalTexture(device, entry.src, width, height)),
      nextIndex: 0,
    }
    entry.externalTexturePool = pool
  }
  const texture = pool.textures[pool.nextIndex]!
  pool.nextIndex = (pool.nextIndex + 1) % pool.textures.length
  entry.texture = texture
  return texture
}

function createExternalTexture(device: GPUDevice, src: string, width: number, height: number): GPUTexture {
  return device.createTexture({
    label: `TextureLoader:${src}`,
    size: {width, height},
    format: "rgba8unorm",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  })
}

function destroyExternalTexturePool(entry: TextureEntry): void {
  const pool = entry.externalTexturePool
  if (pool === undefined) return
  for (const texture of pool.textures) texture.destroy()
  if (entry.texture !== null && pool.textures.includes(entry.texture)) entry.texture = null
  delete entry.externalTexturePool
}

async function decodeBitmap(blob: Blob): Promise<ImageBitmap> {
  const source = await normaliseSvgBlob(blob)
  try {
    return await createImageBitmap(source)
  } catch {
    const objectUrl = URL.createObjectURL(source)
    try {
      const image = new Image()
      image.decoding = "async"
      image.src = objectUrl
      await image.decode()
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      if (width > 0 && height > 0) {
        return await createImageBitmap(image, {
          resizeWidth: width,
          resizeHeight: height,
          resizeQuality: "high",
        })
      }
      return await createImageBitmap(image)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
}

async function normaliseSvgBlob(blob: Blob): Promise<Blob> {
  if (!blob.type.includes("svg")) return blob
  const text = await blob.text()
  const patched = normaliseSvgRootDimensions(text)
  if (patched === null) return blob
  return new Blob([patched], { type: "image/svg+xml" })
}

export function normaliseSvgRootDimensions(text: string): string | null {
  const svgTagMatch = text.match(/<svg\b[^>]*>/i)
  if (!svgTagMatch) return null

  const svgTag = svgTagMatch[0]
  const hasWidth = /\swidth\s*=/.test(svgTag)
  const hasHeight = /\sheight\s*=/.test(svgTag)
  if (hasWidth && hasHeight) return text

  const viewBox = svgTag.match(/\sviewBox\s*=\s*["']\s*([-+.\deE]+)[\s,]+([-+.\deE]+)[\s,]+([-+.\deE]+)[\s,]+([-+.\deE]+)\s*["']/i)
  if (!viewBox) return null
  const width = Number(viewBox[3])
  const height = Number(viewBox[4])
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null

  const attrs: string[] = []
  if (!hasWidth) attrs.push(`width="${width}"`)
  if (!hasHeight) attrs.push(`height="${height}"`)
  const patchedTag = svgTag.replace(/<svg\b/i, `<svg ${attrs.join(" ")}`)
  const start = svgTagMatch.index ?? 0
  return text.slice(0, start) + patchedTag + text.slice(start + svgTag.length)
}

function notify(src: string, entry?: TextureEntry): void {
  if (entry !== undefined && !alive(entry)) return
  for (const owner of [...leases.get(src)?.values() ?? []]) {
    if (!owner.released && (entry === undefined || owner.entries.has(entry))) {
      try {owner.callback()} catch (error) {console.warn("[TextureLoader] change listener failed:", error)}
    }
  }
}
