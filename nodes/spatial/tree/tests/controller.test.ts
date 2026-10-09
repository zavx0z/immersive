import {afterEach, expect, spyOn, test} from "bun:test"
import {createDocument} from "@zavx0z/immersive-dom"
import {DisplayElement} from "@zavx0z/immersive-dom/display"
import {SpaceElement} from "@zavx0z/immersive-dom/space"
import {ViewPointElement} from "@zavx0z/immersive-dom/viewpoint"
import {Vector3, ViewPoint} from "@zavx0z/immersive-engine"
import type {Presentation} from "@zavx0z/immersive-browser/integration"
import {createSpatialTreeController, createSpatialTreeState} from "../src/controller.ts"
import {createSpatialTreeScene} from "../src/scene.ts"
import type {SpatialTreeController, SpatialTreeSnapshot} from "../contract/controller.ts"
import type {SpatialTreeNode} from "../contract/node.ts"

const controllers: SpatialTreeController[] = []
afterEach(() => { for (const controller of controllers.splice(0)) controller.dispose() })
const settle = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }
const waitDemand = () => new Promise(resolve => setTimeout(resolve, 210))

function fixture(settings: {allVisible?: boolean; preserve?: boolean; motion?: number
  projectPoint?: (point: {x: number; y: number; z: number}) => {x: number; y: number} | null} = {}) {
  const document = createDocument()
  const space = new SpaceElement(document)
  const vp = new ViewPointElement(document)
  document.append(space)
  space.append(vp)
  vp.x = 0
  vp.y = -1500
  vp.z = 1000
  vp.targetX = vp.targetY = vp.targetZ = 0
  vp.near = .1
  vp.far = 100000
  const viewport = {width: 640, height: 400}
  const state = createSpatialTreeState()
  const hosts = new Map<string, DisplayElement>()
  const listeners = new Set<(frame: number) => void>()
  const counts = {queries: 0, projects: 0, published: 0, renders: 0, invalidates: 0}
  let previous: SpatialTreeSnapshot | null = null
  state.subscribe(() => {
    counts.published++
    const snapshot = state.getSnapshot()
    const wanted = new Set(snapshot?.nodes.map(n => n.id) ?? [])
    for (const [id, host] of hosts) if (!wanted.has(id)) {
      previous?.onHost(id, null)
      host.remove()
      hosts.delete(id)
    }
    for (const node of snapshot?.nodes ?? []) if (!hosts.has(node.id)) {
      const host = new DisplayElement(document)
      host.id = `${state.id}-${node.id}`
      hosts.set(node.id, host)
      space.append(host)
      snapshot!.onHost(node.id, host)
    }
    previous = snapshot
  })
  const engine = new ViewPoint({})
  const sync = () => {
    engine.position.set(vp.x, vp.y, vp.z)
    engine.getTarget().set(vp.targetX, vp.targetY, vp.targetZ)
    engine.fov = vp.fov
    engine.near = vp.near
    engine.far = vp.far
    engine.setViewport({left: 40, top: 20, ...viewport})
    engine.updateProjectionMatrix()
    engine.update()
  }
  const projection = {
    kind: "space", owner: space,
    fly(distance: number) {
      sync()
      engine.fly(distance)
      document.transaction(() => {
        vp.x = engine.position.x
        vp.y = engine.position.y
        vp.z = engine.position.z
        vp.targetX = engine.getTarget().x
        vp.targetY = engine.getTarget().y
        vp.targetZ = engine.getTarget().z
      })
    },
    frustumPlanes(overscan = 0) { counts.queries++; sync(); return settings.allVisible ? [] : engine.frustumPlanes(overscan) },
    rayForPoint(point: {x: number; y: number}) { sync(); return engine.rayForClientPoint(point) },
    projectPoint(point: {x: number; y: number; z: number}) {
      counts.projects++
      if (settings.projectPoint) return settings.projectPoint(point)
      if (settings.allVisible) return {x: point.x * 4 + 40, y: point.y * 4 + 20}
      sync()
      const p = new Vector3(point.x, point.y, point.z).applyMatrix4(engine.viewMatrix)
      if (-p.z < vp.near || -p.z > vp.far) return null
      p.applyMatrix4(engine.projectionMatrix)
      return {x: 40 + (p.x + 1) * viewport.width / 2, y: 20 + (1 - p.y) * viewport.height / 2}
    },
  }
  const pulse = () => { for (const listener of [...listeners]) listener(counts.renders) }
  const root = {document, space, viewPoint: vp,
    canvas: {getBoundingClientRect: () => ({left: 40, top: 20, ...viewport})},
    getProjection: () => projection,
    subscribePresented(listener: (frame: number) => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
    invalidate() { counts.invalidates++ },
    render() { counts.renders++; pulse() },
  } as unknown as Presentation
  const controller = createSpatialTreeController({root, state, getViewport: () => viewport,
    preserveViewPoint: settings.preserve ?? false, motionDurationMs: settings.motion ?? 0})
  controllers.push(controller)
  return {controller, state, root, vp, viewport, hosts, counts, pulse, engine, sync}
}
const nodes: SpatialTreeNode[] = [{id: "root", label: "Root"},
  {id: "a", parentId: "root", label: "A"}, {id: "b", parentId: "root", label: "B"}]
const pose = (vp: ViewPointElement) => [vp.x, vp.y, vp.z, vp.targetX, vp.targetY, vp.targetZ]

for (const viewport of [{width: 1920, height: 1088}, {width: 360, height: 800}]) {
  test(`overview реального дерева вписывает все тела и заполняет viewport ${viewport.width}×${viewport.height}`, async () => {
    const f = fixture()
    Object.assign(f.viewport, viewport)
    const input: SpatialTreeNode[] = [{id: "root", label: "Root"}]
    for (let branch = 0; branch < 3; branch++) {
      input.push({id: `b${branch}`, parentId: "root", label: "Branch"})
      for (let leaf = 0; leaf < 7; leaf++) input.push({id: `b${branch}-${leaf}`, parentId: `b${branch}`, label: "Leaf"})
    }
    const scene = createSpatialTreeScene(input, viewport)
    const points = scene.layout.stems.flatMap(stem => [stem.top, stem.bottom].flatMap(plane =>
      Array.from({length: 4}, (_, corner) => ({x: plane.x + ((corner & 1) ? plane.width : 0),
        y: plane.y + ((corner & 2) ? plane.height : 0), z: plane.z}))))
    f.controller.configure(input, () => {})
    await settle()
    f.sync()
    const projected = points.map(p => new Vector3(p.x, p.y, p.z).applyMatrix4(f.engine.viewMatrix).applyMatrix4(f.engine.projectionMatrix))
    for (const p of projected) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1 / 1.12 + 1e-5)
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1 / 1.12 + 1e-5)
      expect(p.z).toBeGreaterThanOrEqual(0)
      expect(p.z).toBeLessThanOrEqual(1)
    }
    const occupied = Math.max(Math.max(...projected.map(p => p.x)) - Math.min(...projected.map(p => p.x)),
      Math.max(...projected.map(p => p.y)) - Math.min(...projected.map(p => p.y))) / 2
    expect(occupied).toBeCloseTo(1 / 1.12, 4)
    const expected = ViewPoint.fitPoseForPoints(points, {x: .35, y: -.75, z: .56}, {fov: f.vp.fov, aspect: viewport.width / viewport.height})
    expect(pose(f.vp)).toEqual([expected.position.x, expected.position.y, expected.position.z,
      expected.target.x, expected.target.y, expected.target.z])
  })
}

test("store существует до Root, refs/callbacks стабильны и preload не меняет selection или pose", async () => {
  const a = createSpatialTreeState(), b = createSpatialTreeState()
  expect(a.id).not.toBe(b.id)
  expect(a.getSnapshot()).toBeNull()
  const f = fixture()
  const selected: string[] = []
  f.controller.configure(nodes, id => selected.push(id))
  await settle()
  const before = pose(f.vp)
  const callbacks = f.state.getSnapshot()!
  const display = f.controller.ensureDisplay("a")
  f.controller.setContent("a", "Content A")
  expect(f.controller.ensureDisplay("a")).toBe(display)
  expect(f.state.getSnapshot()!.selectedId).toBeNull()
  expect(pose(f.vp)).toEqual(before)
  expect(f.state.getSnapshot()!.onHost).toBe(callbacks.onHost)
  expect(f.state.getSnapshot()!.onActivate).toBe(callbacks.onActivate)
  const body = f.state.getSnapshot()!.volumes.find(v => v.id.includes("a"))!
  f.state.getSnapshot()!.onVolumeActivate(body.id, {} as MouseEvent)
  expect(selected).toEqual(["a"])
  expect(f.state.getSnapshot()!.selectedId).toBeNull()
  expect(f.root.document.querySelectorAll("viewpoint")).toHaveLength(1)
  expect(f.root.document.querySelectorAll("space")).toHaveLength(1)
})

test("ошибка configure сохраняет предыдущую сцену, warm content и ViewPoint", async () => {
  const f = fixture()
  f.controller.configure(nodes, () => {})
  f.controller.setContent("a", "A")
  await settle()
  const before = f.state.getSnapshot()
  const vp = pose(f.vp)
  expect(() => f.controller.configure([{id: "x", label: "X"}, {id: "x", label: "Duplicate"}], () => {})).toThrow()
  expect(f.state.getSnapshot()).toBe(before)
  expect(pose(f.vp)).toEqual(vp)
  expect(f.state.getSnapshot()!.contentById.get("a")).toBe("A")
})

test("3D selection сверху вписывает выбранную XY-плоскость в portrait и не упирается в target", async () => {
  const f = fixture()
  f.viewport.width = 360
  f.viewport.height = 800
  f.controller.updateViewport(f.viewport)
  f.controller.configure(nodes, () => {})
  f.controller.select("a", true)
  await settle()
  const node = f.state.getSnapshot()!.nodes.find(n => n.id === "a")!
  expect(f.vp.z).toBeGreaterThan(node.rect.z)
  expect([f.vp.targetX, f.vp.targetY, f.vp.targetZ]).toEqual([node.rect.x + node.rect.width / 2, node.rect.y + node.rect.height / 2, node.rect.z - .0005])
  f.sync()
  const before = f.engine.position.z
  f.engine.navigation = f.vp.navigation
  f.engine.flySpeed = f.vp.flySpeed
  f.engine.zoom((before - node.rect.z + 1000) / f.vp.flySpeed)
  expect(f.engine.position.z).toBeLessThan(node.rect.z)
  expect(f.engine.position.distanceTo(f.engine.getTarget())).toBeGreaterThan(0)
})

test("bounded display/volume set сохраняет выбранный и warm pins, тёплых содержимых не более32", async () => {
  const f = fixture({allVisible: true})
  const catalog = Array.from({length: 1000}, (_, i) => ({id: `node-${i}`, label: `Node ${i}`}))
  f.controller.configure(catalog, () => {})
  for (let i = 960; i < 992; i++) f.controller.setContent(`node-${i}`, `Warm ${i}`)
  f.controller.select("node-999", false)
  f.pulse()
  await settle()
  const snapshot = f.state.getSnapshot()!
  expect(snapshot.nodes.length).toBeLessThanOrEqual(256)
  expect(snapshot.nodes.length).toBeGreaterThan(32)
  expect(snapshot.visibleVolumeIds.size).toBeLessThanOrEqual(6000)
  expect(snapshot.nodes.some(n => n.id === "node-999")).toBe(true)
  for (let i = 960; i < 992; i++) expect(snapshot.nodes.some(n => n.id === `node-${i}`)).toBe(true)
  expect(snapshot.contentById.size).toBe(32)
  expect(() => f.controller.setContent("node-992", "Overflow")).toThrow()
  const rendered = f.counts.renders
  f.controller.release("node-960")
  expect(f.counts.renders).toBe(rendered + 1)
  expect(f.state.getSnapshot()!.contentById.has("node-960")).toBe(false)
})

test("unchanged presented не выполняет полные visibility queries и не публикует заново", async () => {
  const f = fixture()
  f.controller.configure(nodes, () => {})
  await settle()
  f.pulse()
  await settle()
  const before = {...f.counts}
  for (let i = 0; i < 10; i++) { f.pulse(); await settle() }
  expect(f.counts).toEqual(before)
  f.vp.x += 5
  f.pulse()
  await settle()
  expect(f.counts.queries).toBeGreaterThan(before.queries)
})

test("demand ближайшего meaningful unloaded после idle не перемещает selection", async () => {
  const f = fixture()
  const demands: string[] = []
  f.controller.configure(nodes, () => {}, id => demands.push(id))
  f.controller.select("a", true)
  const before = pose(f.vp)
  await settle()
  await waitDemand()
  expect(demands).toEqual(["a"])
  expect(f.state.getSnapshot()!.selectedId).toBe("a")
  expect(pose(f.vp)).toEqual(before)
  f.controller.setContent("a", "Loaded")
  await settle()
  await waitDemand()
  expect(demands.filter(id => id === "a")).toHaveLength(1)
})

test("loaded nearest останавливает demand соседей; движение и release разрешают demand нового nearest", async () => {
  let vp: ViewPointElement
  const f = fixture({allVisible: true, preserve: true, projectPoint: point => ({
    x: (point.x - vp.x) * 4 + 440,
    y: (point.y - vp.y) * 4 + 220,
  })})
  vp = f.vp
  f.viewport.width = 800
  const input = [{id: "a", label: "A", viewport: {width: 100, height: 100}},
    {id: "b", label: "B", viewport: {width: 100, height: 100}}]
  const scene = createSpatialTreeScene(input, f.viewport)
  const center = (id: string) => {
    const r = scene.nodesById.get(id)!.rect
    return {x: r.x + r.width / 2, y: r.y + r.height / 2}
  }
  const moveTo = (id: string) => {
    const point = center(id)
    vp.x = point.x
    vp.y = point.y
    f.pulse()
  }
  const demands: string[] = []
  moveTo("a")
  f.controller.configure(input, () => {}, id => demands.push(id))
  f.controller.setContent("a", "A")
  await settle()
  expect(f.state.getSnapshot()!.nodes.map(node => node.id).sort()).toEqual(["a", "b"])
  await waitDemand()
  expect(demands).toEqual([])
  moveTo("b")
  await settle()
  await waitDemand()
  expect(demands).toEqual(["b"])
  vp.x += .1
  f.pulse()
  await settle()
  await waitDemand()
  expect(demands).toEqual(["b"])
  f.controller.setContent("b", "B")
  moveTo("a")
  await settle()
  await waitDemand()
  expect(demands).toEqual(["b"])
  f.controller.release("b")
  moveTo("b")
  await settle()
  await waitDemand()
  expect(demands).toEqual(["b", "b"])
})

test("focus использует presented loop и прекращается при внешнем жесте", async () => {
  const f = fixture({motion: 300})
  let now = 0
  const clock = spyOn(performance, "now").mockImplementation(() => now)
  try {
    f.controller.configure(nodes, () => {})
    await settle()
    f.controller.select("a", true)
    const before = pose(f.vp)
    now = 150
    f.pulse()
    await settle()
    expect(pose(f.vp)).not.toEqual(before)
    f.vp.x += 50
    const external = pose(f.vp)
    now = 300
    f.pulse()
    await settle()
    expect(pose(f.vp)).toEqual(external)
  } finally { clock.mockRestore() }
})

test("selection без focus отменяет прежний перелёт и сохраняет текущую позу", async () => {
  const f = fixture({motion: 300})
  let now = 0
  const clock = spyOn(performance, "now").mockImplementation(() => now)
  try {
    f.controller.configure(nodes, () => {})
    await settle()
    f.controller.select("a", true)
    now = 75
    f.pulse()
    await settle()
    f.controller.select("b", false)
    const accepted = pose(f.vp)
    now = 300
    f.pulse()
    await settle()
    expect(f.state.getSnapshot()!.selectedId).toBe("b")
    expect(pose(f.vp)).toEqual(accepted)
  } finally { clock.mockRestore() }
})

test("далёкая сущность остаётся coarse volume до legible Display, ensureDisplay не меняет обзор", async () => {
  const f = fixture()
  f.controller.configure([{id: "one", label: "One"}], () => {})
  f.vp.x = 0
  f.vp.y = 0
  f.vp.z = 100000
  f.vp.targetX = f.vp.targetY = f.vp.targetZ = 0
  f.pulse()
  await settle()
  const snapshot = f.state.getSnapshot()!
  expect(snapshot.nodes).toEqual([])
  expect(snapshot.volumes).toHaveLength(1)
  expect(snapshot.visibleVolumeIds.size).toBe(1)
  const before = pose(f.vp)
  f.controller.ensureDisplay("one")
  expect(f.state.getSnapshot()!.nodes.map(node => node.id)).toEqual(["one"])
  expect(f.state.getSnapshot()!.selectedId).toBeNull()
  expect(pose(f.vp)).toEqual(before)
})

test("volume budget применяется к большой сцене без повторного построения cached geometry", async () => {
  const f = fixture({allVisible: true})
  f.controller.configure(Array.from({length: 7000}, (_, i) => ({id: `node-${i}`, label: `Node ${i}`})), () => {})
  await settle()
  const snapshot = f.state.getSnapshot()!
  expect(snapshot.visibleVolumeIds.size).toBe(6000)
  expect(snapshot.volumes).toHaveLength(7000)
  const volumes = snapshot.volumes
  f.controller.select("node-6999", false)
  f.pulse()
  await settle()
  expect(f.state.getSnapshot()!.volumes).toBe(volumes)
  expect(f.state.getSnapshot()!.nodes.length).toBeLessThanOrEqual(256)
})

test("focus из-под уровня использует невырожденную дугу и заканчивается над выбранным Display", async () => {
  const f = fixture({motion: 300, preserve: true})
  let now = 0
  const clock = spyOn(performance, "now").mockImplementation(() => now)
  try {
    f.vp.x = f.vp.y = 0
    f.vp.z = -100
    f.vp.targetX = f.vp.targetY = f.vp.targetZ = 0
    f.controller.configure([{id: "one", label: "One"}], () => {})
    await settle()
    f.controller.select("one", true)
    for (const time of [75, 150, 225, 300]) {
      now = time
      f.pulse()
      await settle()
      expect(Math.hypot(f.vp.x - f.vp.targetX, f.vp.y - f.vp.targetY, f.vp.z - f.vp.targetZ)).toBeGreaterThan(0.001)
    }
    const node = f.state.getSnapshot()!.nodes.find(n => n.id === "one")!
    expect(f.vp.z).toBeGreaterThan(node.rect.z)
  } finally { clock.mockRestore() }
})

test("empty→nonempty выполняет первый overview и controls, сохраняя явно restored ViewPoint", async () => {
  const f = fixture()
  const original = pose(f.vp)
  f.controller.configure([], () => {})
  await settle()
  expect(pose(f.vp)).toEqual(original)
  expect(f.vp.controls).toBe(false)
  f.controller.configure(nodes, () => {})
  await settle()
  expect(f.vp.controls).toBe(true)
  expect(pose(f.vp)).not.toEqual(original)
  const restored = fixture({preserve: true})
  const saved = pose(restored.vp)
  restored.controller.configure([], () => {})
  restored.controller.configure(nodes, () => {})
  await settle()
  expect(pose(restored.vp)).toEqual(saved)
  expect(restored.vp.controls).toBe(false)
})


test("HUD factor команды в fly проходят target, orbit сохраняет radius закон", async () => {
  const f = fixture()
  f.controller.configure(nodes, () => {})
  f.controller.select("a", true)
  const radius = Math.hypot(f.vp.x - f.vp.targetX, f.vp.y - f.vp.targetY, f.vp.z - f.vp.targetZ)
  const originalEye = f.vp.z
  const originalTarget = f.vp.targetZ
  for (let i = 0; i < 5; i++) f.controller.zoom(.5)
  expect(f.vp.z).toBeCloseTo(originalEye - radius * 2.5, 8)
  expect(f.vp.z).toBeLessThan(originalTarget)
  expect(f.vp.targetZ).toBeCloseTo(originalTarget - radius * 2.5, 8)
  expect(Math.hypot(f.vp.x - f.vp.targetX, f.vp.y - f.vp.targetY, f.vp.z - f.vp.targetZ)).toBeCloseTo(radius, 8)
  const before = pose(f.vp)
  expect(() => f.controller.zoom(0)).toThrow(RangeError)
  expect(() => f.controller.zoom(Infinity)).toThrow(RangeError)
  expect(pose(f.vp)).toEqual(before)
  f.vp.navigation = "orbit"
  const target = [f.vp.targetX, f.vp.targetY, f.vp.targetZ]
  f.controller.zoom(.5)
  expect([f.vp.targetX, f.vp.targetY, f.vp.targetZ]).toEqual(target)
  expect(Math.hypot(f.vp.x - f.vp.targetX, f.vp.y - f.vp.targetY, f.vp.z - f.vp.targetZ)).toBeCloseTo(radius * .5, 8)
  await settle()
})
