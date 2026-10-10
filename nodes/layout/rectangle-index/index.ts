/**
Неизменяемый пространственный индекс готовых прямоугольников.

Построение O(n log n) сортирует центры по Morton-коду и собирает сбалансированный
BVH без рекурсии. Запрос отбрасывает непересекающиеся области, ограничивает число
ID и явно сообщает truncated. Viewport, камера и materialization принадлежат
потребителю. Пересечение включает касание границ.

@packageDocumentation
*/
import type {LayoutNodeGeometry, LayoutRectangle} from "../protocol/types/src/protocol.ts"

export interface RectangleIndex {
  readonly size: number
  /** limit по умолчанию 1000; truncated означает наличие других пересечений. */
  query(bounds: LayoutRectangle, options?: Readonly<{limit?: number}>): RectangleIndexQuery
}

export interface RectangleIndexQuery {
  readonly ids: readonly string[]
  readonly truncated: boolean
}

interface Entry {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly id?: string
  readonly first?: Entry
  readonly second?: Entry
}

/** Копирует геометрию; последующее изменение входного массива не меняет индекс. */
export function createRectangleIndex(rectangles: readonly LayoutNodeGeometry[]): RectangleIndex {
  const ids = new Set<string>()
  const entries = rectangles.map(rect => {
    validateRectangle(rect, true)
    if (ids.has(rect.id)) throw new Error(`duplicate rectangle: ${rect.id}`)
    ids.add(rect.id)
    return {id: rect.id, left: rect.x, top: rect.y, right: rect.x + rect.width, bottom: rect.y + rect.height}
  })
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const rect of entries) {
    const x = rect.left / 2 + rect.right / 2
    const y = rect.top / 2 + rect.bottom / 2
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }
  const keyed = entries.map(entry => ({entry, key: morton(
    quantize(entry.left / 2 + entry.right / 2, minX, maxX),
    quantize(entry.top / 2 + entry.bottom / 2, minY, maxY),
  )}))
  keyed.sort((a, b) => a.key - b.key || (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0))
  let layer: Entry[] = keyed.map(({entry}) => entry)
  while (layer.length > 1) {
    const next: Entry[] = []
    for (let index = 0; index < layer.length; index += 2) {
      const first = layer[index]!
      const second = layer[index + 1]
      next.push(second === undefined ? first : {
        left: Math.min(first.left, second.left),
        top: Math.min(first.top, second.top),
        right: Math.max(first.right, second.right),
        bottom: Math.max(first.bottom, second.bottom),
        first,
        second,
      })
    }
    layer = next
  }
  const root = layer[0]
  return Object.freeze({
    size: entries.length,
    query(bounds: LayoutRectangle, options?: Readonly<{limit?: number}>): RectangleIndexQuery {
      validateRectangle(bounds, false)
      const limit = options?.limit ?? 1_000
      if (!Number.isSafeInteger(limit) || limit <= 0) throw new RangeError("rectangle query limit must be a positive safe integer")
      const right = bounds.x + bounds.width
      const bottom = bounds.y + bounds.height
      const found: string[] = []
      const stack: Entry[] = root === undefined ? [] : [root]
      while (stack.length > 0) {
        const entry = stack.pop()!
        if (entry.left > right || entry.right < bounds.x || entry.top > bottom || entry.bottom < bounds.y) continue
        if (entry.id !== undefined) {
          if (found.length === limit) return {ids: found, truncated: true}
          found.push(entry.id)
        } else {
          stack.push(entry.second!, entry.first!)
        }
      }
      return {ids: found, truncated: false}
    },
  })
}

function validateRectangle(rect: LayoutRectangle, positive: boolean): void {
  if (![rect.x, rect.y, rect.width, rect.height, rect.x + rect.width, rect.y + rect.height].every(Number.isFinite) ||
    (positive ? rect.width <= 0 || rect.height <= 0 : rect.width < 0 || rect.height < 0)) {
    throw new RangeError("rectangle geometry must be finite with valid dimensions")
  }
}

function quantize(value: number, min: number, max: number): number {
  if (min === max) return 0
  const span = max - min
  const scale = Math.max(Math.abs(min), Math.abs(max), 1)
  const fraction = Number.isFinite(span)
    ? (value - min) / span
    : (value / scale - min / scale) / (max / scale - min / scale)
  return Math.max(0, Math.min(65_535, Math.floor(fraction * 65_535)))
}

function morton(x: number, y: number): number {
  const spread = (value: number): number => {
    value = (value | (value << 8)) & 0x00ff00ff
    value = (value | (value << 4)) & 0x0f0f0f0f
    value = (value | (value << 2)) & 0x33333333
    return (value | (value << 1)) & 0x55555555
  }
  return (spread(x) | (spread(y) << 1)) >>> 0
}
