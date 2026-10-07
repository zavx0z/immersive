import type {Document} from "./document.ts"
import {HTMLElement} from "./html-element.ts"
import {Event} from "./event.ts"
import {parseHTMLInteger, toLong} from "./internal/web-idl.ts"

export type VideoPlaybackState = Readonly<{
  paused: boolean
  readyState: number
  currentTime: number
  videoWidth: number
  videoHeight: number
  error: Readonly<{code: number; message: string}> | null
  resource: string | null
}>

export type VideoPlaybackController = Readonly<{
  play(): Promise<void>
  pause(): void
}>

type PendingPlay = {resolve(): void; reject(error: unknown): void}
const subscribers = new WeakMap<Document, Set<(video: HTMLVideoElement) => void>>()
const states = new WeakMap<HTMLVideoElement, VideoPlaybackState>()
const bindings = new WeakMap<HTMLVideoElement, VideoPlaybackController>()
const pendingPlays = new WeakMap<HTMLVideoElement, PendingPlay[]>()
const activePlays = new WeakMap<HTMLVideoElement, Set<PendingPlay>>()

/** Семантика видео. Декодер и общий цикл кадров принадлежат Browser. */
export class HTMLVideoElement extends HTMLElement {
  private mediaSource: object | null = null
  private mediaMuted: boolean | null = null
  private requestedTime = 0
  private wantsPlayback = false

  constructor(document: Document) {
    super(document, "video")
    states.set(this, emptyState())
  }

  get src(): string { return this.getAttribute("src") ?? "" }
  set src(value: string) { this.setAttribute("src", value) }
  get srcObject(): object | null { return this.mediaSource }
  set srcObject(value: object | null) {
    if (value !== null && typeof value !== "object") throw new TypeError("srcObject must be a media object or null")
    if (this.mediaSource === value) return
    this.mediaSource = value
    states.set(this, emptyState())
    notify(this)
  }
  get autoplay(): boolean { return this.hasAttribute("autoplay") }
  set autoplay(value: boolean) { this.toggleAttribute("autoplay", Boolean(value)) }
  get defaultMuted(): boolean { return this.hasAttribute("muted") }
  set defaultMuted(value: boolean) { this.toggleAttribute("muted", Boolean(value)) }
  get muted(): boolean { return this.mediaMuted ?? this.defaultMuted }
  set muted(value: boolean) {
    this.mediaMuted = Boolean(value)
    notify(this)
  }
  get playsInline(): boolean { return this.hasAttribute("playsinline") }
  set playsInline(value: boolean) { this.toggleAttribute("playsinline", Boolean(value)) }
  get loop(): boolean { return this.hasAttribute("loop") }
  set loop(value: boolean) { this.toggleAttribute("loop", Boolean(value)) }
  get width(): number { return dimension(this.getAttribute("width")) }
  set width(value: number) { this.setAttribute("width", String(toLong(value, 32, true))) }
  get height(): number { return dimension(this.getAttribute("height")) }
  set height(value: number) { this.setAttribute("height", String(toLong(value, 32, true))) }
  get paused(): boolean { return states.get(this)!.paused }
  get readyState(): number { return states.get(this)!.readyState }
  get videoWidth(): number { return states.get(this)!.videoWidth }
  get videoHeight(): number { return states.get(this)!.videoHeight }
  get error(): VideoPlaybackState["error"] { return states.get(this)!.error }
  get currentTime(): number { return states.get(this)!.currentTime }
  set currentTime(value: number) {
    if (!Number.isFinite(value) || value < 0) throw new TypeError("currentTime must be finite and non-negative")
    this.requestedTime = value
    states.set(this, {...states.get(this)!, currentTime: value})
    notify(this)
  }

  play(): Promise<void> {
    this.wantsPlayback = true
    const promise = new Promise<void>((resolve, reject) => {
      const pending = pendingPlays.get(this) ?? []
      pending.push({resolve, reject})
      pendingPlays.set(this, pending)
    })
    notify(this)
    flushPlays(this)
    return promise
  }

  pause(): void {
    this.wantsPlayback = false
    bindings.get(this)?.pause()
    rejectPlays(this)
    const state = states.get(this)!
    if (!state.paused) {
      publishVideoPlaybackState(this, {...state, paused: true})
      if (!bindings.has(this)) this.dispatchEvent(new Event("pause"))
    }
    notify(this)
  }

  /** Снимок запросов для Browser, без обращения к нативному DOM. */
  readPlaybackRequest(): Readonly<{playing: boolean; currentTime: number}> {
    return {playing: this.wantsPlayback, currentTime: this.requestedTime}
  }
}

export function subscribeDocumentVideoChanges(document: Document, subscriber: (video: HTMLVideoElement) => void): () => void {
  let entries = subscribers.get(document)
  if (entries === undefined) subscribers.set(document, entries = new Set())
  entries.add(subscriber)
  return () => entries.delete(subscriber)
}

/** Browser подключает единственный декодер и отменяет ожидающее play при освобождении. */
export function bindVideoPlayback(video: HTMLVideoElement, controller: VideoPlaybackController): () => void {
  if (bindings.has(video)) throw new Error("Video playback owner is already bound")
  bindings.set(video, controller)
  const hasPending = (pendingPlays.get(video)?.length ?? 0) > 0
  flushPlays(video)
  if (video.readPlaybackRequest().playing && !hasPending) void controller.play().catch(() => {})
  return () => {
    if (bindings.get(video) !== controller) return
    bindings.delete(video)
    rejectPlays(video)
    publishVideoPlaybackState(video, emptyState())
  }
}

export function readVideoPlaybackState(video: HTMLVideoElement): VideoPlaybackState { return states.get(video)! }

export function publishVideoPlaybackState(video: HTMLVideoElement, state: VideoPlaybackState): void {
  const previous = states.get(video)!
  states.set(video, Object.freeze({...state}))
  // Время и paused читаются синхронно; только метрики/ресурс требуют новой раскладки.
  if (previous.videoWidth !== state.videoWidth || previous.videoHeight !== state.videoHeight || previous.resource !== state.resource) notify(video)
}

function notify(video: HTMLVideoElement): void {
  for (const subscriber of [...subscribers.get(video.ownerDocument!) ?? []]) subscriber(video)
}

function flushPlays(video: HTMLVideoElement): void {
  const controller = bindings.get(video)
  const pending = pendingPlays.get(video)
  if (controller === undefined || pending === undefined || pending.length === 0) return
  pendingPlays.delete(video)
  let active = activePlays.get(video)
  if (active === undefined) activePlays.set(video, active = new Set())
  for (const request of pending) active.add(request)
  void Promise.resolve().then(() => {
    if (bindings.get(video) !== controller || !video.readPlaybackRequest().playing) throw abortError()
    return controller.play()
  }).then(() => {
    if (bindings.get(video) !== controller || !video.readPlaybackRequest().playing) throw abortError()
    for (const request of pending) request.resolve()
  }).catch(error => { for (const request of pending) request.reject(error) }).finally(() => {
    for (const request of pending) active.delete(request)
  })
}

function rejectPlays(video: HTMLVideoElement): void {
  const pending = pendingPlays.get(video)
  pendingPlays.delete(video)
  for (const request of pending ?? []) request.reject(abortError())
  const active = activePlays.get(video)
  for (const request of active ?? []) request.reject(abortError())
  active?.clear()
}

const abortError = (): Error => Object.assign(new Error("Video playback was interrupted"), {name: "AbortError"})
const emptyState = (): VideoPlaybackState => ({paused: true, readyState: 0, currentTime: 0, videoWidth: 0, videoHeight: 0, error: null, resource: null})
const dimension = (value: string | null): number => {
  const parsed = value === null ? null : parseHTMLInteger(value)
  return parsed !== null && parsed >= 0 ? parsed : 0
}
