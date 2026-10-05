import { Object3D } from "../core/object-3d"
import { BufferGeometry, BufferAttribute } from "../core/buffer-geometry"
import { TrueTypeFont } from "../text/true-type-font"
import { TextMaterial } from "../material/text-material"

type Point = { x: number; y: number; on: boolean }
type TextLayoutOptions = Readonly<{letterSpacing?: number, spaceAdvance?: number | null}>
type LayoutEvictionListener = (geometry: BufferGeometry) => void
type TextLayoutCacheEntry = {
  key: string
  users: number
  arrayBytes: number
  keyBytes: number
  stencilVerts: Float32Array
  stencilIndices: Uint32Array
  coverVerts: Float32Array
  coverIndices: Uint32Array
  sharedStencilGeometry?: BufferGeometry
  sharedCoverGeometry?: BufferGeometry
}

const ADAPTIVE_TOLERANCE_FU = 0.5
const MAX_SUBDIVISION_DEPTH = 12
const TEXT_LAYOUT_CACHE_LIMIT = 4096
const TEXT_LAYOUT_INACTIVE_BYTE_LIMIT = 16 * 1024 * 1024

function pointLineDistance(px: number, py: number, x0: number, y0: number, x1: number, y1: number): number {
  const dx = x1 - x0
  const dy = y1 - y0
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x0, py - y0)
  const t = ((px - x0) * dx + (py - y0) * dy) / len2
  const projx = x0 + t * dx
  const projy = y0 + t * dy
  return Math.hypot(px - projx, py - projy)
}

function splitQuad(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number]
): [[number, number], [number, number], [number, number], [number, number], [number, number]] {
  const p01: [number, number] = [(p0[0] + p1[0]) * 0.5, (p0[1] + p1[1]) * 0.5]
  const p12: [number, number] = [(p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5]
  const p012: [number, number] = [(p01[0] + p12[0]) * 0.5, (p01[1] + p12[1]) * 0.5]
  return [p0, p01, p012, p12, p2]
}

function quadBezierAdaptive(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  tolerance: number,
  out: number[],
  depth = 0
) {
  if (depth > MAX_SUBDIVISION_DEPTH) {
    out.push(p2[0], p2[1])
    return
  }
  const err = pointLineDistance(p1[0], p1[1], p0[0], p0[1], p2[0], p2[1])
  if (err <= tolerance) {
    out.push(p2[0], p2[1])
    return
  }
  const [a, b, c, d, e] = splitQuad(p0, p1, p2)
  quadBezierAdaptive(a, b, c, tolerance, out, depth + 1)
  quadBezierAdaptive(c, d, e, tolerance, out, depth + 1)
}

function outlineToPolylineTTF(o: { points: Float32Array; onCurve: Uint8Array; contours: Uint16Array }): {
  points: Float32Array
  contours: Uint32Array
} {
  const P = o.points
  const ON = o.onCurve
  const ends = o.contours
  const outPts: number[] = []
  const outEnds: number[] = []
  let start = 0
  for (let ci = 0; ci < ends.length; ci++) {
    const end = ends[ci]!
    if (end < start) continue // Skip empty or invalid contours
    const contourStartIndex = outPts.length / 2
    const count = end - start + 1
    const get = (i: number): Point => {
      const idx = start + (((i % count) + count) % count)
      return { x: P[idx * 2] || 0, y: P[idx * 2 + 1] || 0, on: ON[idx] !== 0 }
    }
    let prev = get(0)
    if (!prev.on) {
      const last = get(count - 1)
      prev = last.on ? { ...last } : { x: (last.x + prev.x) * 0.5, y: (last.y + prev.y) * 0.5, on: true }
      outPts.push(prev.x, prev.y)
    } else {
      outPts.push(prev.x, prev.y)
    }
    for (let i = 1; i <= count; i++) {
      const curr = get(i)
      if (prev.on && curr.on) {
        outPts.push(curr.x, curr.y)
        prev = curr
      } else if (prev.on && !curr.on) {
        const next = get(i + 1)
        let endPt: Point = next.on ? next : { x: (curr.x + next.x) * 0.5, y: (curr.y + next.y) * 0.5, on: true }
        if (next.on) i++
        quadBezierAdaptive([prev.x, prev.y], [curr.x, curr.y], [endPt.x, endPt.y], ADAPTIVE_TOLERANCE_FU, outPts)
        prev = endPt
      }
    }
    if (outPts.length / 2 - contourStartIndex >= 3) outEnds.push(outPts.length / 2 - 1)
    start = end + 1
  }
  return { points: new Float32Array(outPts), contours: new Uint32Array(outEnds) }
}

function makeFanIndices(contourEnds: Uint32Array, indexOffset: number): Uint32Array {
  const idx: number[] = []
  let start = 0
  for (const end of contourEnds) {
    for (let i = start + 1; i < end; i++) idx.push(start + indexOffset, i + indexOffset, i + 1 + indexOffset)
    start = end + 1
  }
  return new Uint32Array(idx)
}

/**
 * Изменяемый текстовый узел с собственной геометрией.
 *
 * Используйте `Text`, когда текст является частью 3D/2D-сцены и его геометрия
 * должна принадлежать конкретному экземпляру:
 *
 * - текст деформируется вручную через `stencilGeometry` / `coverGeometry`;
 * - координаты вершин меняются каждый кадр и помечаются `needsUpdate`;
 * - строка, `fontSize` или `letterSpacing` меняются на лету через
 *   `updateGeometry()`;
 * - нужен обычный независимый scene-node без разделения GPU-буферов.
 *
 * Внутри `Text` может переиспользовать CPU-раскладку строки, но итоговые
 * `BufferGeometry` клонируются для каждого экземпляра. Поэтому внешняя мутация
 * геометрии не затронет другие текстовые узлы.
 *
 * Для immediate-mode UI и повторяющихся неизменяемых надписей используйте
 * {@link CachedText}: он шарит геометрию и GPU-буферы ради производительности.
 */
export class Text extends Object3D {
  public readonly isText: true = true
  public type = "Text"
  public text: string
  public font: TrueTypeFont
  public material: TextMaterial
  public fontSize: number
  public letterSpacing: number
  public spaceAdvance: number | null
  public stencilGeometry: BufferGeometry = new BufferGeometry()
  public coverGeometry: BufferGeometry = new BufferGeometry()

  /**
   * Screen-space scissor (framebuffer-pixels): (minX, minY, maxX, maxY).
   * Фрагменты вне rect'а discardятся в шейдере. null = clipping выключен.
   * Использует @builtin(position) фрагмента, поэтому работает на любом
   * z-плане без parallax от perspective-камеры.
   */
  public clipBounds: [number, number, number, number] | null = null

  private static geometryCache: WeakMap<TrueTypeFont, Map<number, { stencil: BufferGeometry; cover: BufferGeometry }>> = new WeakMap()
  private static layoutCache: Map<string, TextLayoutCacheEntry> = new Map()
  private static inactiveLayouts: Map<string, TextLayoutCacheEntry> = new Map()
  private static cachedLayoutGeometries: WeakSet<BufferGeometry> = new WeakSet()
  private sharedLayout: TextLayoutCacheEntry | undefined
  private static inactiveLayoutBytes = 0
  private static layoutEvictionListeners = new Set<WeakRef<LayoutEvictionListener>>()
  private static listenerFinalizer = new FinalizationRegistry<WeakRef<LayoutEvictionListener>>(reference => {
    Text.layoutEvictionListeners.delete(reference)
  })
  private static layoutFinalizer = new FinalizationRegistry<TextLayoutCacheEntry>(layout => {
    Text.releaseLayout(layout)
  })
  private static fontIds: WeakMap<TrueTypeFont, number> = new WeakMap()
  private static nextFontId = 1

  /**
   * Создаёт изменяемый текст с собственной геометрией.
   *
   * @param text - Строка для отрисовки.
   * @param font - Загруженный TrueType-шрифт.
   * @param fontSize - Размер текста в world units.
   * @param material - Материал заливки текста.
   * @param options - Окончательные интервалы первого построения; без них сохраняются fontSize * 0.05 и null.
   */
  constructor(text: string, font: TrueTypeFont, fontSize: number = 10, material: TextMaterial, options: TextLayoutOptions = {}) {
    super()
    this.text = text
    this.font = font
    this.fontSize = fontSize
    this.material = material
    this.letterSpacing = options.letterSpacing ?? fontSize * 0.05
    this.spaceAdvance = options.spaceAdvance ?? null
    this.updateGeometry()
  }

  /** @internal */
  protected useSharedLayout(): boolean {
    return false
  }

  /**
   * Перестраивает геометрию по текущим `text`, `font`, `fontSize` и
   * `letterSpacing`.
   *
   * Вызывайте этот метод после изменения текстовых параметров. Для `Text`
   * результатом всегда будут новые собственные `BufferGeometry`, которые можно
   * безопасно мутировать. Для {@link CachedText} результатом будет разделяемая
   * кэшированная геометрия, которую мутировать вручную нельзя.
   */
  public updateGeometry(): void {
    const cacheKey = Text.layoutCacheKey(this.text, this.font, this.fontSize, this.letterSpacing, this.spaceAdvance)
    const cachedLayout = Text.layoutCache.get(cacheKey)
    if (cachedLayout) {
      Text.touchLayoutCache(cacheKey, cachedLayout)
      this.applyLayout(cachedLayout)
      Text.trimLayoutCache()
      return
    }

    const allStencilVerts: number[] = []
    const allStencilIndices: number[] = []
    const allCoverVerts: number[] = []
    const allCoverIndices: number[] = []

    let penX = 0
    const scale = this.fontSize / this.font.unitsPerEm
    const characters = Array.from(this.text)
    let fontGeometryCache = Text.geometryCache.get(this.font)
    if (fontGeometryCache === undefined) {
      fontGeometryCache = new Map()
      Text.geometryCache.set(this.font, fontGeometryCache)
    }

    for (let characterIndex = 0; characterIndex < characters.length; characterIndex += 1) {
      const char = characters[characterIndex]!
      const hasNextCharacter = characterIndex + 1 < characters.length
      if (char === " ") {
        penX += this.spaceAdvance ?? this.font.unitsPerEm * 0.3 * scale
        if (hasNextCharacter) penX += this.letterSpacing
        continue
      }

      const gid = this.font.mapCharToGlyph(char.codePointAt(0)!)
      const metric = this.font.getHMetric(gid)
      let cachedGeo = fontGeometryCache.get(gid)

      if (!cachedGeo) {
        const outline = this.font.getGlyphOutline(gid)
        const poly = outlineToPolylineTTF(outline)

        const stencilGeo = new BufferGeometry()
        const coverGeo = new BufferGeometry()

        if (poly.points.length > 0) {
          const stencilIndices = makeFanIndices(poly.contours, 0)
          stencilGeo.setAttribute("position", new BufferAttribute(poly.points, 2)) // Use 2D points directly
          stencilGeo.setIndex(new BufferAttribute(stencilIndices, 1))

          let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity
          for (let i = 0; i < poly.points.length; i += 2) {
            const x = poly.points[i]!
            const y = poly.points[i + 1]!
            if (x < minX) minX = x
            if (y < minY) minY = y
            if (x > maxX) maxX = x
            if (y > maxY) maxY = y
          }

          // The horizontal cover owns the complete glyph advance cell, including
          // its left/right side bearings. Ink overhang still expands beyond the
          // cell by a small precision pad. This keeps the cover pass from ending
          // on the final outline edge without introducing an arbitrary wide pad.
          const padFu = this.font.unitsPerEm * 0.005
          const coverMinX = Math.min(0, minX - padFu)
          const coverMaxX = Math.max(metric.advanceWidth, maxX + padFu)
          const coverMinY = minY - padFu
          const coverMaxY = maxY + padFu

          const coverVerts = new Float32Array([
            coverMinX, coverMinY,
            coverMaxX, coverMinY,
            coverMinX, coverMaxY,
            coverMaxX, coverMaxY,
          ])
          const coverIndices = new Uint32Array([0, 1, 2, 2, 1, 3])
          coverGeo.setAttribute("position", new BufferAttribute(coverVerts, 2))
          coverGeo.setIndex(new BufferAttribute(coverIndices, 1))
        }

        cachedGeo = { stencil: stencilGeo, cover: coverGeo }
        fontGeometryCache.set(gid, cachedGeo)
      }

      const currentStencilVertexOffset = allStencilVerts.length / 3
      const stencilPos = cachedGeo.stencil.attributes.position?.array as Float32Array
      if (stencilPos) {
        for (let i = 0; i < stencilPos.length; i += 2) {
          allStencilVerts.push(stencilPos[i]! * scale + penX, stencilPos[i + 1]! * scale, 0)
        }
        const stencilIndices = cachedGeo.stencil.index?.array as Uint32Array
        if (stencilIndices) {
          for (let i = 0; i < stencilIndices.length; i++) {
            allStencilIndices.push(stencilIndices[i]! + currentStencilVertexOffset)
          }
        }
      }

      const currentCoverVertexOffset = allCoverVerts.length / 3
      const coverPos = cachedGeo.cover.attributes.position?.array as Float32Array
      if (coverPos) {
        for (let i = 0; i < coverPos.length; i += 2) {
          allCoverVerts.push(coverPos[i]! * scale + penX, coverPos[i + 1]! * scale, 0)
        }
        const coverIndices = cachedGeo.cover.index?.array as Uint32Array
        if (coverIndices) {
          for (let i = 0; i < coverIndices.length; i++) {
            allCoverIndices.push(coverIndices[i]! + currentCoverVertexOffset)
          }
        }
      }

      penX += metric.advanceWidth * scale
      if (hasNextCharacter) penX += this.letterSpacing
    }

    const layout: TextLayoutCacheEntry = {
      key: cacheKey,
      users: 0,
      arrayBytes: 0,
      keyBytes: cacheKey.length * 2,
      stencilVerts: new Float32Array(allStencilVerts),
      stencilIndices: new Uint32Array(allStencilIndices),
      coverVerts: new Float32Array(allCoverVerts),
      coverIndices: new Uint32Array(allCoverIndices),
    }
    layout.arrayBytes = layout.stencilVerts.byteLength + layout.stencilIndices.byteLength + layout.coverVerts.byteLength + layout.coverIndices.byteLength
    Text.rememberLayout(cacheKey, layout)
    this.applyLayout(layout)
    Text.trimLayoutCache()
  }

  private applyLayout(layout: TextLayoutCacheEntry): void {
    if (this.useSharedLayout()) {
      if (this.sharedLayout !== layout) {
        const previous = this.sharedLayout
        if (layout.users === 0) {
          Text.inactiveLayouts.delete(layout.key)
          Text.inactiveLayoutBytes -= layout.arrayBytes + layout.keyBytes
        }
        layout.users += 1
        this.sharedLayout = layout
        Text.layoutFinalizer.unregister(this)
        Text.layoutFinalizer.register(this, layout, this)
        if (previous !== undefined) Text.releaseLayout(previous)
      }
      this.stencilGeometry = Text.sharedGeometry(layout, "stencil")
      this.coverGeometry = Text.sharedGeometry(layout, "cover")
      return
    }
    this.stencilGeometry = Text.createGeometry(layout.stencilVerts, layout.stencilIndices, true)
    this.coverGeometry = Text.createGeometry(layout.coverVerts, layout.coverIndices, true)
  }

  private static createGeometry(vertices: Float32Array, indices: Uint32Array, clone: boolean): BufferGeometry {
    const geometry = new BufferGeometry()
    geometry.setAttribute("position", new BufferAttribute(clone ? new Float32Array(vertices) : vertices, 3))
    geometry.setIndex(new BufferAttribute(clone ? new Uint32Array(indices) : indices, 1))
    return geometry
  }

  private static sharedGeometry(layout: TextLayoutCacheEntry, kind: "stencil" | "cover"): BufferGeometry {
    if (kind === "stencil") {
      layout.sharedStencilGeometry ??= Text.createGeometry(layout.stencilVerts, layout.stencilIndices, false)
      Text.cachedLayoutGeometries.add(layout.sharedStencilGeometry)
      return layout.sharedStencilGeometry
    }
    layout.sharedCoverGeometry ??= Text.createGeometry(layout.coverVerts, layout.coverIndices, false)
    Text.cachedLayoutGeometries.add(layout.sharedCoverGeometry)
    return layout.sharedCoverGeometry
  }

  private static layoutCacheKey(text: string, font: TrueTypeFont, fontSize: number, letterSpacing: number, spaceAdvance: number | null): string {
    let fontId = Text.fontIds.get(font)
    if (fontId === undefined) {
      fontId = Text.nextFontId++
      Text.fontIds.set(font, fontId)
    }
    return `${fontId}:${fontSize.toFixed(8)}:${letterSpacing.toFixed(8)}:${spaceAdvance?.toFixed(8) ?? "default"}:${text}`
  }

  private static touchLayoutCache(key: string, layout: TextLayoutCacheEntry): void {
    Text.layoutCache.delete(key)
    Text.layoutCache.set(key, layout)
    if (layout.users === 0) {
      Text.inactiveLayouts.delete(key)
      Text.inactiveLayouts.set(key, layout)
    }
  }

  private static rememberLayout(key: string, layout: TextLayoutCacheEntry): void {
    Text.layoutCache.set(key, layout)
    Text.inactiveLayouts.set(key, layout)
    Text.inactiveLayoutBytes += layout.arrayBytes + layout.keyBytes
  }

  private static releaseLayout(layout: TextLayoutCacheEntry): void {
    layout.users -= 1
    if (layout.users === 0) {
      Text.inactiveLayouts.set(layout.key, layout)
      Text.inactiveLayoutBytes += layout.arrayBytes + layout.keyBytes
      Text.trimLayoutCache()
    }
  }

  private static trimLayoutCache(): void {
    if (Text.inactiveLayoutBytes <= TEXT_LAYOUT_INACTIVE_BYTE_LIMIT && Text.layoutCache.size <= TEXT_LAYOUT_CACHE_LIMIT) return
    for (const [key, layout] of Text.inactiveLayouts) {
      Text.inactiveLayouts.delete(key)
      Text.layoutCache.delete(key)
      Text.inactiveLayoutBytes -= layout.arrayBytes + layout.keyBytes
      for (const geometry of [layout.sharedStencilGeometry, layout.sharedCoverGeometry]) {
        if (geometry === undefined) continue
        Text.cachedLayoutGeometries.delete(geometry)
        for (const reference of Text.layoutEvictionListeners) {
          const listener = reference.deref()
          if (listener === undefined) Text.layoutEvictionListeners.delete(reference)
          else {
            try { listener(geometry) } catch { /* Наблюдатель ресурсов не отменяет построение текста. */ }
          }
        }
      }
      if (Text.inactiveLayoutBytes <= TEXT_LAYOUT_INACTIVE_BYTE_LIMIT && Text.layoutCache.size <= TEXT_LAYOUT_CACHE_LIMIT) break
    }
  }

  /**
   * Завершает использование общей раскладки этим узлом. Повторный вызов безопасен.
   * GPU-ресурсы принадлежат рисующему владельцу, а не Text. После освобождения
   * CachedText больше не рисуют; updateGeometry() может заново получить раскладку.
   * Обычный Text сохраняет собственные изменяемые массивы.
   */
  public dispose(): void {
    const previous = this.sharedLayout
    if (previous === undefined) return
    this.sharedLayout = undefined
    Text.layoutFinalizer.unregister(this)
    this.stencilGeometry = new BufferGeometry()
    this.coverGeometry = new BufferGeometry()
    Text.releaseLayout(previous)
  }

  /** @internal */
  static isCachedLayoutGeometry(geometry: BufferGeometry): boolean {
    return Text.cachedLayoutGeometries.has(geometry)
  }

  /**
   * Наблюдает окончательное вытеснение общей геометрии без глобального удержания владельца.
   * Каждый рисующий владелец хранит возвращённую отписку весь свой lifecycle и
   * вызывает её при dispose. Активные CachedText не передаются наблюдателям.
   * Уведомление доставляется каждому подписчику; общей очереди геометрии нет.
   */
  static onLayoutEvicted(listener: LayoutEvictionListener): () => void {
    const reference = new WeakRef(listener)
    Text.layoutEvictionListeners.add(reference)
    Text.listenerFinalizer.register(listener, reference, reference)
    return () => {
      // Отписка удерживает callback только у потребителя; глобальное множество хранит WeakRef.
      if (reference.deref() === listener) Text.layoutEvictionListeners.delete(reference)
      Text.listenerFinalizer.unregister(reference)
    }
  }

  /**
   * Показывает удержание массивов и верхнюю UTF-16 оценку ключей без заявления о полном JS heap/RSS.
   * Активный набор не вытесняется ради лимита и может превышать бюджет неактивных записей.
   */
  static getLayoutCacheStats() {
    let activeEntries = 0
    let activeUsers = 0
    let activeBytes = 0
    let arrayBytes = 0
    let keyBytes = 0
    for (const layout of Text.layoutCache.values()) {
      arrayBytes += layout.arrayBytes
      keyBytes += layout.keyBytes
      if (layout.users > 0) {
        activeEntries += 1
        activeUsers += layout.users
        activeBytes += layout.arrayBytes + layout.keyBytes
      }
    }
    return Object.freeze({
      entries: Text.layoutCache.size,
      activeEntries,
      inactiveEntries: Text.layoutCache.size - activeEntries,
      activeUsers,
      activeBytes,
      inactiveBytes: Text.inactiveLayoutBytes,
      arrayBytes,
      keyBytes,
      maxInactiveBytes: TEXT_LAYOUT_INACTIVE_BYTE_LIMIT,
      maxEntries: TEXT_LAYOUT_CACHE_LIMIT,
    })
  }
}

/**
 * Кэшируемый текстовый узел для immediate-mode UI.
 *
 * Используйте `CachedText`, когда много одинаковых или часто пересоздаваемых
 * надписей рисуются как UI-элементы: редактор, списки, таблицы, меню, панели,
 * скроллируемый текст. Экземпляры с одинаковыми `text`, `font`, `fontSize`,
 * `letterSpacing` и `spaceAdvance` получают общую раскладку и общую `BufferGeometry`.
 * Каждый рисующий владелец переиспользует свои GPU-буферы. Это снижает стоимость
 * scroll/render циклов, где одни и те же строки появляются снова.
 *
 * Геометрию `CachedText` нельзя менять вручную: не записывайте в
 * `stencilGeometry.attributes.position.array`, не изгибайте и не помечайте её
 * `needsUpdate`. Такая геометрия разделяется между экземплярами. Позицию,
 * трансформации, материал, видимость и `clipBounds` менять можно, потому что это
 * состояние конкретного объекта, а не общей геометрии.
 *
 * При окончательном удалении узла вызовите dispose(): он освобождает его lease.
 * Невидимый, но сохранённый узел остаётся активным потребителем. Смена параметров
 * через updateGeometry() переводит lease; GC освобождает забытый узел, но не
 * заменяет явный lifecycle. Общую геометрию не передают другому живому владельцу
 * после dispose исходного узла.
 *
 * Если текст нужно деформировать, редактировать вершины или хранить как
 * независимый scene-node, используйте {@link Text}.
 */
export class CachedText extends Text {
  public readonly isCachedText: true = true
  public override type = "CachedText"

  /**
   * Создаёт UI-текст с разделяемой кэшированной геометрией.
   *
   * @param text - Строка для отрисовки.
   * @param font - Загруженный TrueType-шрифт.
   * @param fontSize - Размер текста в world units.
   * @param material - Материал заливки текста. Материал остаётся per-instance.
   * @param options - Окончательные интервалы первого построения, без промежуточной раскладки.
   */
  constructor(text: string, font: TrueTypeFont, fontSize: number = 10, material: TextMaterial, options: TextLayoutOptions = {}) {
    super(text, font, fontSize, material, options)
  }

  /** @internal */
  protected override useSharedLayout(): boolean {
    return true
  }
}
