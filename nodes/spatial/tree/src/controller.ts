import type {ComposeSlotInput} from "@zavx0z/immersive-component/slot"
import type {DisplayElement} from "@zavx0z/immersive-dom/display"
import {ViewPoint, type ViewPointPose} from "@zavx0z/immersive-engine"
import type {SpatialTreeController, SpatialTreeControllerOptions, SpatialTreeSnapshot, SpatialTreeState} from "../contract/controller.ts"
import type {SpatialTreeNode} from "../contract/node.ts"
import {createSpatialTreeScene, type SpatialTreeBounds, type SpatialTreeDisplay, type SpatialTreeScene} from "./scene.ts"
import {createSpatialVisibilityIndex, intersectsFrustum, spatialVolumeBounds} from "./visibility.ts"

const DISPLAY_LIMIT = 256
const WARM_LIMIT = 32
const VOLUME_LIMIT = 6000
const MINIMUM_PROJECTED_SIZE = 80
let stateIdentity = 0

/** Store можно передать View до создания единственного Browser Root. */
export function createSpatialTreeState(): SpatialTreeState {
  let value: SpatialTreeSnapshot | null = null
  const listeners = new Set<() => void>()
  return Object.freeze({
    id: `spatial-tree-${++stateIdentity}`,
    getSnapshot: () => value,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    publish(snapshot: SpatialTreeSnapshot | null) { value = snapshot; for (const listener of [...listeners]) listener() },
  })
}

/** Viewer владеет проекциями, visibility и navigation; источник передаёт только данные и content. */
export function createSpatialTreeController(options: SpatialTreeControllerOptions): SpatialTreeController {
  const root = options.root
  const state = options.state ?? createSpatialTreeState()
  const hosts = new Map<string, DisplayElement>()
  const content = new Map<string, ComposeSlotInput["content"]>()
  const forced = new Set<string>()
  const demanded = new Set<string>()
  const projection = root.getProjection(root.space)
  let scene: SpatialTreeScene | null = null
  let nodeIndex = createSpatialVisibilityIndex([])
  let volumeIndex = createSpatialVisibilityIndex([])
  let volumeBoundsById = new Map<string, SpatialTreeBounds>()
  let visibleNodes: readonly string[] = []
  let visibleVolumes: ReadonlySet<string> = new Set()
  let selectedId: string | null = null
  let revision = 0
  let residency = 0
  let viewport = options.getViewport()
  let disposed = false
  let queued = false
  let queryKey = ""
  let snapshotKey = ""
  let demandKey = ""
  let demandTimer: ReturnType<typeof setTimeout> | null = null
  let selectCallback: (id: string, focus?: boolean) => void = () => {}
  let demandCallback: ((id: string) => void) | undefined
  const duration = options.motionDurationMs ?? 300
  if (!Number.isFinite(duration) || duration < 0) throw new RangeError("Focus motion duration must be non-negative")
  let motion: {from: ViewPointPose; to: ViewPointPose; started: number; written: string} | null = null

  const assertActive = () => { if (disposed) throw new Error("Spatial tree controller is disposed") }
  const size = () => viewport ?? options.getViewport() ?? {width: 960, height: 540}
  const pose = (): ViewPointPose => ({position: {x: root.viewPoint.x, y: root.viewPoint.y, z: root.viewPoint.z},
    target: {x: root.viewPoint.targetX, y: root.viewPoint.targetY, z: root.viewPoint.targetZ}})
  const poseKey = () => [root.viewPoint.x, root.viewPoint.y, root.viewPoint.z,
    root.viewPoint.targetX, root.viewPoint.targetY, root.viewPoint.targetZ].join(":")
  const requireNode = (id: string) => {
    const node = scene?.nodesById.get(id)
    if (node === undefined) throw new Error(`Unknown spatial tree node: ${id}`)
    return node
  }
  const pins = () => {
    const ids = new Set([...content.keys(), ...forced])
    if (selectedId !== null && scene?.nodesById.has(selectedId)) ids.add(selectedId)
    return ids
  }
  const onHost = (id: string, host: DisplayElement | null) => {
    if (host === null) hosts.delete(id)
    else if (!disposed && scene?.nodesById.has(id)) hosts.set(id, host)
  }
  const onActivate = (id: string, focus = true) => {
    if (!disposed && scene?.nodesById.has(id)) selectCallback(id, focus)
  }
  const onVolumeActivate = (id: string, _event: MouseEvent) => {
    const owner = scene?.volumeOwnerById.get(id)
    if (owner !== undefined) onActivate(owner, true)
  }
  const publish = () => {
    if (disposed || scene === null) return
    const pinned = pins()
    const ids = new Set(pinned)
    for (const id of visibleNodes) if (ids.size < DISPLAY_LIMIT) ids.add(id)
    const nodes = [...ids].flatMap(id => { const node = scene!.nodesById.get(id); return node === undefined ? [] : [node] })
    const disabledHitIds = new Set(nodes.flatMap(node => {
      const body = scene!.bodyIdByNode.get(node.id)
      return body === undefined ? [] : [body]
    }))
    state.publish({nodes, volumes: scene.volumes, bodyVolumes: scene.bodyVolumes, branchVolumes: scene.branchVolumes,
      visibleVolumeIds: visibleVolumes, disabledHitIds,
      geometryRevision: revision, selectedId, selectedVolumeId: selectedId === null ? null : scene.bodyIdByNode.get(selectedId) ?? null,
      contentById: new Map(content), floor: scene.floor, showGrid: options.showGrid === true, onHost, onActivate, onVolumeActivate})
    root.invalidate()
  }
  const writeClip = () => {
    if (scene === null) return
    const current = pose()
    const range = ViewPoint.depthRangeForBounds(scene.bounds, current)
    const floorRange = options.showGrid === true ? ViewPoint.depthRangeForBounds(scene.floorBounds, current) : null
    const near = range?.near ?? root.viewPoint.near
    const far = Math.max(range?.far ?? root.viewPoint.far, floorRange?.far ?? 0)
    root.document.transaction(() => {
      if (root.viewPoint.near !== near) root.viewPoint.near = near
      if (root.viewPoint.far !== far) root.viewPoint.far = far
    })
  }
  const writePose = (value: ViewPointPose) => {
    root.document.transaction(() => {
      root.viewPoint.x = value.position.x
      root.viewPoint.y = value.position.y
      root.viewPoint.z = value.position.z
      root.viewPoint.targetX = value.target.x
      root.viewPoint.targetY = value.target.y
      root.viewPoint.targetZ = value.target.z
      writeClip()
    })
    root.invalidate()
  }
  const overview = () => {
    const s = size()
    function* points() {
      const point = {x: 0, y: 0, z: 0}
      for (const stem of scene!.layout.stems) for (let side = 0; side < 2; side++) {
        const plane = side === 0 ? stem.top : stem.bottom
        for (let corner = 0; corner < 4; corner++) {
          point.x = plane.x + ((corner & 1) === 0 ? 0 : plane.width)
          point.y = plane.y + ((corner & 2) === 0 ? 0 : plane.height)
          point.z = plane.z
          yield point
        }
      }
    }
    return ViewPoint.fitPoseForPoints(points(), {x: 0.35, y: -0.75, z: 0.56}, {fov: root.viewPoint.fov, aspect: s.width / s.height})
  }
  const focusPose = (node: SpatialTreeDisplay) => {
    const s = size()
    const r = node.rect
    const bounds: SpatialTreeBounds = {min: {x: r.x, y: r.y, z: r.z - 0.001}, max: {x: r.x + r.width, y: r.y + r.height, z: r.z}}
    return ViewPoint.fitPoseForBounds(bounds, {x: 0, y: 0, z: 1}, {fov: root.viewPoint.fov, aspect: s.width / s.height})
  }
  const moveTo = (to: ViewPointPose, immediate = false) => {
    if (immediate || duration === 0) { motion = null; writePose(to); return }
    motion = {from: pose(), to, started: performance.now(), written: poseKey()}
    root.invalidate()
  }
  const advance = () => {
    if (motion === null) return
    if (poseKey() !== motion.written) { motion = null; return }
    const t = Math.min(1, (performance.now() - motion.started) / duration)
    const blend = t * t * (3 - 2 * t)
    const interpolate = (a: number, b: number) => a + (b - a) * blend
    const target = {x: interpolate(motion.from.target.x, motion.to.target.x),
      y: interpolate(motion.from.target.y, motion.to.target.y), z: interpolate(motion.from.target.z, motion.to.target.z)}
    const from = {x: motion.from.position.x - motion.from.target.x, y: motion.from.position.y - motion.from.target.y,
      z: motion.from.position.z - motion.from.target.z}
    const to = {x: motion.to.position.x - motion.to.target.x, y: motion.to.position.y - motion.to.target.y,
      z: motion.to.position.z - motion.to.target.z}
    const fromLength = Math.hypot(from.x, from.y, from.z), toLength = Math.hypot(to.x, to.y, to.z)
    const a = {x: from.x / fromLength, y: from.y / fromLength, z: from.z / fromLength}
    const b = {x: to.x / toLength, y: to.y / toLength, z: to.z / toLength}
    const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))
    let direction: {x: number; y: number; z: number}
    if (dot < -0.999999) {
      // Из-под уровня к виду сверху: дуга не проходит через вырожденный eye=target.
      const tangent = Math.abs(a.z) < 0.9 ? {x: -a.y, y: a.x, z: 0} : {x: a.z, y: 0, z: -a.x}
      const length = Math.hypot(tangent.x, tangent.y, tangent.z)
      const c = Math.cos(Math.PI * blend), q = Math.sin(Math.PI * blend) / length
      direction = {x: a.x * c + tangent.x * q, y: a.y * c + tangent.y * q, z: a.z * c + tangent.z * q}
    } else if (dot > 0.999999) {
      direction = {x: interpolate(a.x, b.x), y: interpolate(a.y, b.y), z: interpolate(a.z, b.z)}
    } else {
      const angle = Math.acos(dot), sine = Math.sin(angle)
      const u = Math.sin((1 - blend) * angle) / sine, v = Math.sin(blend * angle) / sine
      direction = {x: a.x * u + b.x * v, y: a.y * u + b.y * v, z: a.z * u + b.z * v}
    }
    const radius = interpolate(fromLength, toLength) / Math.hypot(direction.x, direction.y, direction.z)
    writePose({position: {x: target.x + direction.x * radius, y: target.y + direction.y * radius,
      z: target.z + direction.z * radius}, target})
    if (t === 1) motion = null
    else motion.written = poseKey()
  }
  const projected = (node: SpatialTreeDisplay) => {
    const r = node.rect
    const points = [{x: r.x, y: r.y, z: r.z}, {x: r.x + r.width, y: r.y, z: r.z},
      {x: r.x + r.width, y: r.y + r.height, z: r.z}, {x: r.x, y: r.y + r.height, z: r.z}].map(point => projection.projectPoint(point))
    const valid = points.filter((p): p is {x: number; y: number} => p !== null)
    // Частично пересекающий near frame нельзя скрывать из-за заднего угла.
    if (valid.length < 4) return {size: Infinity, center: null}
    const x = Math.min(...valid.map(p => p.x)), y = Math.min(...valid.map(p => p.y))
    const width = Math.max(...valid.map(p => p.x)) - x, height = Math.max(...valid.map(p => p.y)) - y
    return {size: Math.min(width, height), center: {x: x + width / 2, y: y + height / 2}}
  }
  const update = () => {
    queued = false
    if (disposed || scene === null) return
    const s = size()
    const cacheKey = () => `${poseKey()}:${root.viewPoint.fov}:${root.viewPoint.near}:${root.viewPoint.far}:${s.width}:${s.height}:${revision}:${residency}:${selectedId}`
    if (cacheKey() === queryKey) return
    writeClip()
    queryKey = cacheKey()
    const planes = projection.frustumPlanes(96)
    const eye = pose().position
    const nodeQuery = nodeIndex.query(planes, {eye, limit: DISPLAY_LIMIT * 4, maxVisited: DISPLAY_LIMIT * 32})
    const volumeQuery = volumeIndex.query(planes, {eye, limit: VOLUME_LIMIT, maxVisited: VOLUME_LIMIT * 8})
    const pinned = pins()
    const budget = DISPLAY_LIMIT - Math.max(WARM_LIMIT, pinned.size)
    const next: string[] = []
    const retained = new Set(visibleNodes)
    let nearest: {id: string; score: number} | null = null
    const client = root.canvas.getBoundingClientRect()
    for (const id of nodeQuery.ids) {
      const node = scene.nodesById.get(id)!
      const p = projected(node)
      const threshold = retained.has(id) || pinned.has(id) ? MINIMUM_PROJECTED_SIZE : MINIMUM_PROJECTED_SIZE * 1.2
      if (p.size < threshold) continue
      if (next.length < budget && !pinned.has(id)) next.push(id)
      if (p.center === null) continue
      const x = p.center.x - client.left, y = p.center.y - client.top
      if (x < 0 || y < 0 || x > s.width || y > s.height) continue
      const score = Math.hypot(x - s.width / 2, y - s.height / 2)
      if (nearest === null || score < nearest.score) nearest = {id, score}
    }
    const nextVolumes = new Set(volumeQuery.ids)
    if (nextVolumes.size < VOLUME_LIMIT) {
      const expanded = projection.frustumPlanes(192)
      for (const id of visibleVolumes) {
        if (nextVolumes.size === VOLUME_LIMIT) break
        const bounds = volumeBoundsById.get(id)
        if (bounds !== undefined && intersectsFrustum(bounds, expanded)) nextVolumes.add(id)
      }
    }
    const signature = JSON.stringify([next.slice().sort(), [...nextVolumes].sort()])
    if (signature !== snapshotKey) {
      snapshotKey = signature
      visibleNodes = next
      visibleVolumes = nextVolumes
      publish()
    }
    const demand = `${poseKey()}:${revision}:${residency}:${nearest?.id ?? ""}`
    if (demand !== demandKey) {
      demandKey = demand
      if (demandTimer !== null) clearTimeout(demandTimer)
      demandTimer = setTimeout(() => {
        demandTimer = null
        if (disposed || nearest === null || content.has(nearest.id) || demanded.has(nearest.id) || demandCallback === undefined) return
        demanded.add(nearest.id)
        demandCallback(nearest.id)
      }, 180)
    }
  }
  const presented = root.subscribePresented(() => {
    if (disposed || scene === null) return
    advance()
    if (queued) return
    queued = true
    queueMicrotask(update)
  })
  const controller: SpatialTreeController = {
    state,
    get configured() { return scene !== null },
    configure(nodes, onSelect, onDemand) {
      assertActive()
      for (const node of nodes) if (!node.id.trim() || !node.label.trim()) throw new TypeError("Spatial tree nodes require non-empty IDs and labels")
      const next = createSpatialTreeScene(nodes, size(), options.layout)
      const nextNodes = createSpatialVisibilityIndex(next.nodes.map(node => ({id: node.id, bounds: {
        min: {x: node.rect.x, y: node.rect.y, z: node.rect.z},
        max: {x: node.rect.x + node.rect.width, y: node.rect.y + node.rect.height, z: node.rect.z},
      }})))
      const boundsById = new Map(next.volumes.map(volume => [volume.id, spatialVolumeBounds(volume.from, volume.to)]))
      const nextVolumes = createSpatialVisibilityIndex([...boundsById].map(([id, bounds]) => ({id, bounds})))
      const first = scene === null || scene.nodes.length === 0
      scene = next
      nodeIndex = nextNodes
      volumeIndex = nextVolumes
      volumeBoundsById = boundsById
      motion = null
      if (demandTimer !== null) clearTimeout(demandTimer)
      demandTimer = null
      demandKey = ""
      revision++
      queryKey = snapshotKey = ""
      for (const id of [...content.keys()]) if (!next.nodesById.has(id)) { content.delete(id); forced.delete(id); demanded.delete(id) }
      for (const id of [...forced]) if (!next.nodesById.has(id)) forced.delete(id)
      if (selectedId !== null && !next.nodesById.has(selectedId)) selectedId = null
      selectCallback = onSelect
      demandCallback = onDemand
      visibleNodes = []
      visibleVolumes = new Set(next.volumes.slice(0, VOLUME_LIMIT).map(v => v.id))
      root.viewPoint.navigation = "fly"
      root.viewPoint.flySpeed = Math.max(1, next.layerGap / 40)
      if (first && !options.preserveViewPoint && next.nodes.length > 0) {
        root.viewPoint.controls = true
        moveTo(overview(), true)
      }
      publish()
      root.render()
    },
    ensureDisplay(id) {
      assertActive()
      requireNode(id)
      if (hosts.has(id)) return hosts.get(id)!
      const warm = new Set([...content.keys(), ...forced])
      if (!warm.has(id) && warm.size >= WARM_LIMIT) throw new Error("Release inactive spatial content before reserving another Display")
      forced.add(id)
      residency++
      publish()
      root.render()
      const host = hosts.get(id)
      if (host === undefined) throw new Error(`Spatial Display ${id} did not mount in the existing Root`)
      return host
    },
    setContent(id, value) {
      assertActive()
      requireNode(id)
      if (value === null || value === undefined || value === false) { controller.release(id); return }
      if (!content.has(id) && content.size >= WARM_LIMIT) throw new Error("Release inactive spatial content before adding another warm view")
      if (content.get(id) === value) return
      content.set(id, value)
      forced.delete(id)
      demanded.add(id)
      residency++
      publish()
      root.render()
    },
    release(id) {
      assertActive()
      const hadContent = content.delete(id)
      const hadForced = forced.delete(id)
      const hadDemand = demanded.delete(id)
      const changed = hadContent || hadForced || hadDemand
      if (changed) {
        residency++
        publish()
        root.render()
      }
    },
    select(id, focus = false) {
      assertActive()
      const node = requireNode(id)
      motion = null
      selectedId = id
      residency++
      publish()
      if (focus) moveTo(focusPose(node))
    },
    zoom(factor) {
      assertActive()
      if (!Number.isFinite(factor) || factor <= 0) throw new RangeError("Spatial zoom factor must be finite and positive")
      const vp = root.viewPoint
      const distance = Math.hypot(vp.x - vp.targetX, vp.y - vp.targetY, vp.z - vp.targetZ)
      if (distance === 0) return
      motion = null
      if (vp.navigation === "fly") projection.fly(distance * (1 - factor))
      else vp.dollyTo(distance * factor)
      root.invalidate()
    },
    fit() { assertActive(); if (scene !== null && scene.nodes.length > 0) moveTo(overview()) },
    updateViewport(value) {
      assertActive()
      if (![value.width, value.height].every(Number.isFinite) || value.width <= 0 || value.height <= 0) throw new RangeError("Spatial viewport must be positive and finite")
      if (viewport?.width === value.width && viewport?.height === value.height) return
      viewport = value
      queryKey = ""
      root.invalidate()
    },
    dispose() {
      if (disposed) return
      disposed = true
      motion = null
      if (demandTimer !== null) clearTimeout(demandTimer)
      presented()
      hosts.clear()
      content.clear()
      forced.clear()
      demanded.clear()
      state.publish(null)
    },
  }
  return Object.freeze(controller)
}
