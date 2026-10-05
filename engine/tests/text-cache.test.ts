import {expect, spyOn, test} from "bun:test"
import {CachedText, Text, TextMaterial, TrueTypeFont} from "../src/index.ts"

const readFont = (name = "inter-regular") => Bun.file(new URL(`../static/font/${name}.ttf`, import.meta.url)).arrayBuffer().then(data => new TrueTypeFont(data))
const material = () => new TextMaterial({color: 0xffffff})
const arrays = (text: Text) => [text.stencilGeometry.attributes.position!.array, text.stencilGeometry.index!.array,
  text.coverGeometry.attributes.position!.array, text.coverGeometry.index!.array]

test("окончательные интервалы дают прежнюю геометрию за одно первое построение", async () => {
  for (const name of ["inter-regular", "jetbrains-mono-regular"]) {
    const font = await readFont(name)
    for (const size of [10, 16, 32]) {
      for (const value of ["Hello", "Привет мир", " a  b ", ""]) {
        const legacy = new Text(value, font, size, material())
        expect(legacy.letterSpacing).toBe(size * 0.05)
        expect(legacy.spaceAdvance).toBeNull()
        legacy.letterSpacing = 1.25
        legacy.spaceAdvance = size * 0.4
        legacy.updateGeometry()
        const updates = spyOn(Text.prototype, "updateGeometry")
        try {
          const text = new Text(value, font, size, material(), {letterSpacing: 1.25, spaceAdvance: size * 0.4})
          expect(updates).toHaveBeenCalledTimes(1)
          expect(arrays(text)).toEqual(arrays(legacy))
          const cached = new CachedText(value, font, size, material(), {letterSpacing: 1.25, spaceAdvance: size * 0.4})
          expect(updates).toHaveBeenCalledTimes(2)
          expect(arrays(cached)).toEqual(arrays(legacy))
          cached.dispose()
        } finally { updates.mockRestore() }
      }
    }
  }
})

test("Text хранит независимые массивы, CachedText разделяет layout и переводит lease при изменениях", async () => {
  const font = await readFont()
  const otherFont = await readFont("inter-bold")
  const before = Text.getLayoutCacheStats().activeUsers
  const first = new CachedText("Общий текст", font, 16, material())
  const second = new CachedText("Общий текст", font, 16, material())
  const mutable = new Text("Общий текст", font, 16, material())
  const independent = new Text("Общий текст", font, 16, material())
  try {
    expect(first.stencilGeometry).toBe(second.stencilGeometry)
    expect(first.coverGeometry).toBe(second.coverGeometry)
    expect(arrays(mutable)).toEqual(arrays(first))
    expect(mutable.stencilGeometry).not.toBe(independent.stencilGeometry)
    expect(arrays(mutable)[0]).not.toBe(arrays(first)[0])
    const original = arrays(independent)[0]![0]!
    arrays(mutable)[0]![0] = original + 100
    expect(arrays(independent)[0]![0]).toBe(original)
    expect(arrays(second)[0]![0]).toBe(original)
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 2)
    const retained = second.stencilGeometry
    first.text = "Изменённый текст"
    first.font = otherFont
    first.fontSize = 24
    first.letterSpacing = 0
    first.spaceAdvance = 0
    first.updateGeometry()
    expect(first.stencilGeometry).not.toBe(retained)
    expect(second.stencilGeometry).toBe(retained)
    expect(Text.isCachedLayoutGeometry(retained)).toBeTrue()
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 2)
    const same = first.stencilGeometry
    first.updateGeometry()
    expect(first.stencilGeometry).toBe(same)
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 2)
    first.dispose()
    first.dispose()
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 1)
    first.updateGeometry()
    expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 2)
  } finally {
    first.dispose()
    second.dispose()
  }
  expect(Text.getLayoutCacheStats().activeUsers).toBe(before)
})

test("byte budget включает длинные whitespace keys, защищает активные consumers и уведомляет каждого GPU owner", async () => {
  const font = await readFont()
  const nodes: CachedText[] = []
  const firstOwner: object[] = []
  const secondOwner: object[] = []
  const closeFirst = Text.onLayoutEvicted(geometry => firstOwner.push(geometry))
  const closeSecond = Text.onLayoutEvicted(geometry => secondOwner.push(geometry))
  const before = Text.getLayoutCacheStats().activeUsers
  let alias: CachedText | undefined
  try {
    const value = " ".repeat(65_536)
    for (let index = 0; index < 130; index++) nodes.push(new CachedText(value, font, index + 1, material()))
    alias = new CachedText(value, font, 1, material())
    const geometry = alias.stencilGeometry
    expect(geometry).toBe(nodes[0]!.stencilGeometry)
    const active = Text.getLayoutCacheStats()
    expect(active.maxInactiveBytes).toBe(16 * 1024 * 1024)
    expect(active.activeBytes).toBeGreaterThan(active.maxInactiveBytes)
    expect(active.keyBytes).toBeGreaterThan(active.maxInactiveBytes)
    expect(active.activeUsers).toBe(before + 131)
    expect(firstOwner).toEqual([])
    nodes.forEach(node => node.dispose())
    const retained = Text.getLayoutCacheStats()
    expect(retained.activeUsers).toBe(before + 1)
    expect(retained.inactiveBytes).toBeLessThanOrEqual(retained.maxInactiveBytes)
    expect(firstOwner.length).toBeGreaterThan(0)
    expect(secondOwner).toEqual(firstOwner)
    expect(firstOwner).not.toContain(geometry)
    expect(Text.isCachedLayoutGeometry(geometry)).toBeTrue()
    expect(alias.stencilGeometry).toBe(geometry)
    closeFirst()
    const count = firstOwner.length
    alias.dispose()
    expect(firstOwner).toHaveLength(count)
    expect(secondOwner.length).toBeGreaterThan(count)
    const final = Text.getLayoutCacheStats()
    expect(final.activeUsers).toBe(before)
    expect(final.inactiveBytes).toBeLessThanOrEqual(final.maxInactiveBytes)
    expect(final.entries).toBeLessThanOrEqual(final.maxEntries)
    expect(final.arrayBytes + final.keyBytes).toBe(final.activeBytes + final.inactiveBytes)
  } finally {
    nodes.forEach(node => node.dispose())
    alias?.dispose()
    closeFirst()
    closeSecond()
  }
})

test("уникальные раскладки и префиксы не держат более бюджета и вытеснение сохраняет вид повторного текста", async () => {
  const font = await readFont()
  const source = new Text("A".repeat(512), font, 16, material(), {letterSpacing: 0})
  for (let index = 0; index < 512; index++) {
    const text = new CachedText("A".repeat(512 + index), font, 16, material(), {letterSpacing: 0})
    text.dispose()
  }
  const stats = Text.getLayoutCacheStats()
  expect(stats.arrayBytes).toBeGreaterThan(0)
  expect(stats.inactiveBytes).toBeLessThanOrEqual(stats.maxInactiveBytes)
  expect(stats.entries).toBeLessThanOrEqual(stats.maxEntries)
  const repeated = new CachedText(source.text, font, 16, material(), {letterSpacing: 0})
  try { expect(arrays(repeated)).toEqual(arrays(source)) } finally { repeated.dispose() }
})

test("count limit вытесняет только неактивные записи даже при большом активном наборе", async () => {
  const font = await readFont()
  const nodes: CachedText[] = []
  try {
    const count = Text.getLayoutCacheStats().maxEntries + 1
    for (let index = 0; index < count; index++) nodes.push(new CachedText("x", font, index + 1, material()))
    const active = Text.getLayoutCacheStats()
    expect(active.activeEntries).toBeGreaterThan(active.maxEntries)
    expect(Text.isCachedLayoutGeometry(nodes[0]!.stencilGeometry)).toBeTrue()
    nodes.forEach(node => node.dispose())
    const inactive = Text.getLayoutCacheStats()
    expect(inactive.entries).toBeLessThanOrEqual(inactive.maxEntries)
    expect(inactive.inactiveBytes).toBeLessThanOrEqual(inactive.maxInactiveBytes)
  } finally { nodes.forEach(node => node.dispose()) }
})

test("забытый consumer не удерживается cache, а GC освобождает его lease без dispose", async () => {
  const font = await readFont()
  const before = Text.getLayoutCacheStats().activeUsers
  let node: CachedText | undefined = new CachedText("GC lease", font, 16, material())
  const weak = new WeakRef(node)
  expect(Text.getLayoutCacheStats().activeUsers).toBe(before + 1)
  node = undefined
  await collectUntil(() => weak.deref() === undefined && Text.getLayoutCacheStats().activeUsers === before)
  expect(Text.getLayoutCacheStats().activeUsers).toBe(before)
})

test("глобальные eviction listeners не удерживают забытый рисующий owner", async () => {
  const abandonedOwner = () => {
    const owner = {geometries: [] as object[]}
    Text.onLayoutEvicted(geometry => owner.geometries.push(geometry))
    return new WeakRef(owner)
  }
  const weak = abandonedOwner()
  await collectUntil(() => weak.deref() === undefined)
  expect(weak.deref()).toBeUndefined()
})

async function collectUntil(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 2_000
  do {
    await new Promise(resolve => setTimeout(resolve, 0))
    Bun.gc(true)
    await new Promise(resolve => setTimeout(resolve, 0))
    if (predicate()) return
  } while (Date.now() < deadline)
  throw new Error("GC не освободил слабый consumer в пределах теста")
}
