import {textOffsetAtPosition, type Node, type Range} from "@zavx0z/immersive-dom"
import type {RenderRangeRect} from "./text-selection.ts"
import type {RenderFrame, RenderTextHighlight, TextDisplayItem, RenderPathGeometry, RenderPathPoint} from "./types.ts"

type Row = {rect: RenderRangeRect; flow: Node; block: Node; end: number | null; paintBefore?: Readonly<{node: Node; key: string}>}
const epsilon = 0.001
const border = Object.freeze({widths: Object.freeze({top: 0, right: 0, bottom: 0, left: 0}),
  colors: Object.freeze({top: "transparent", right: "transparent", bottom: "transparent", left: "transparent"}),
  radii: Object.freeze({topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0})})

/** Контур объединяется только внутри одного текстового потока и одной цепочки обрезки. */
export function buildTextHighlights(frame: RenderFrame, rects: readonly RenderRangeRect[], range: Range,
  key: string, color: string, sources: (node: Node) => readonly TextDisplayItem[]): readonly RenderTextHighlight[] {
  const caret = range.collapsed
  const rows: Row[] = []
  for (let rect of rects) {
    const items = sources(rect.node)
    const source = items.find(item => Math.abs(item.y * item.transform.scaleY + item.transform.translateY - rect.y) < epsilon) ?? items[0]
    let block: Node = rect.node
    while (block.parentNode && (!frame.boxByNode.has(block) || frame.boxByNode.get(block)?.display === "inline")) block = block.parentNode
    let boundary: Node | null = rect.node
    while (boundary && frame.boxByNode.get(boundary)?.userSelect !== "contain" && frame.boxByNode.get(boundary)?.userSelect !== "all") boundary = boundary.parentNode
    const flow = source?.source?.selectionRoot ?? boundary ?? block.parentNode ?? block
    const start = source ? textOffsetAtPosition(block, source.node, source.source?.offsets[0] ?? 0) : null
    const end = source ? textOffsetAtPosition(block, source.node, source.source?.offsets.at(-1) ?? 0) : null
    const box = frame.boxByNode.get(block)
    if (!caret && start !== null && start > 0 && box && (block.textContent ?? "").slice(0, start).trim() === "" &&
      (range.comparePoint(block, 0) === 0 || textOffsetAtPosition(block, range.startContainer, range.startOffset) === 0)) {
      const x = box.contentX * box.transform.scaleX + box.transform.translateX
      if (x < rect.x) rect = {...rect, x, width: rect.x + rect.width - x}
    }
    const row = !caret && rows.find(value => value.flow === flow && value.block === block && sameClips(value.rect, rect) &&
      Math.abs(value.rect.y - rect.y) < epsilon && Math.abs(value.rect.height - rect.height) < epsilon &&
      rect.x + rect.width >= value.rect.x - epsilon && (rect.x <= value.rect.x + value.rect.width + epsilon ||
        start !== null && value.end !== null && value.end <= start && (block.textContent ?? "").slice(value.end, start).trim() === ""))
    if (row) {
      const x = Math.min(row.rect.x, rect.x)
      row.rect = {...row.rect, x, width: Math.max(row.rect.x + row.rect.width, rect.x + rect.width) - x}
      row.end = end
    } else rows.push({rect, flow, block, end, ...(source ? {paintBefore: {node: source.node, key: source.key}} : {})})
  }
  rows.sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
  const groups: Row[][] = []
  for (const row of rows) {
    const group = !caret && groups.find(values => {
      const last = values.at(-1)!
      return last.flow === row.flow && sameClips(last.rect, row.rect) &&
        Math.abs(last.rect.y + last.rect.height - row.rect.y) < epsilon &&
        Math.min(last.rect.x + last.rect.width, row.rect.x + row.rect.width) > Math.max(last.rect.x, row.rect.x) + epsilon
    })
    if (group) group.push(row)
    else groups.push([row])
  }
  return Object.freeze(groups.flatMap((group, index) => {
    const first = group[0]!
    const x = Math.min(...group.map(row => row.rect.x))
    const y = first.rect.y
    const width = Math.max(...group.map(row => row.rect.x + row.rect.width)) - x
    const radius = caret ? 0 : Math.min(4, width / 2, first.rect.height / 4)
    const contour = group.length > 1 ? roundedContour(group.map(row => row.rect), x, y, radius) : undefined
    return group.map((row, part) => Object.freeze({...row.rect, x, width, kind: "rect" as const, key: `${key}:${index}:${part}`,
      color, opacity: caret ? 1 : 0.35, shadow: null,
      border: Object.freeze({...border, radii: Object.freeze({topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius})}),
      ...(row.paintBefore ? {paintBefore: row.paintBefore} : first.paintBefore ? {paintBefore: first.paintBefore} : {}),
      ...(contour ? {contour: contourSlice(contour, row.rect.y - y, row.rect.height)} : {}),
    }))
  }))
}

/** Сравнение геометрии clips не объединяет соседние панели с разными viewport. */
function sameClips(a: RenderRangeRect, b: RenderRangeRect): boolean {
  return a.clips === b.clips || a.clips.length === b.clips.length && a.clips.every((clip, index) => {
    const other = b.clips[index]!
    return clip === other || clip.x === other.x && clip.y === other.y && clip.width === other.width && clip.height === other.height &&
      clip.clipX === other.clipX && clip.clipY === other.clipY && clip.presentationOwner === other.presentationOwner &&
      JSON.stringify(clip.transform) === JSON.stringify(other.transform) && JSON.stringify(clip.radii) === JSON.stringify(other.radii)
  })
}

/** Обходит ступенчатый внешний контур строк; квадратичные дуги сглаживают также вогнутые углы. */
function roundedContour(rows: readonly RenderRangeRect[], x: number, y: number, radius: number): RenderPathGeometry {
  const points: RenderPathPoint[] = []
  const add = (px: number, py: number) => points.push({x: px - x, y: py - y})
  add(rows[0]!.x, rows[0]!.y)
  for (const row of rows) {
    add(row.x + row.width, row.y)
    add(row.x + row.width, row.y + row.height)
  }
  for (const row of [...rows].reverse()) {
    add(row.x, row.y + row.height)
    add(row.x, row.y)
  }
  points.pop()
  let changed = true
  while (changed && points.length > 3) {
    changed = false
    for (let i = 0; i < points.length; i++) {
      const a = points[(i + points.length - 1) % points.length]!
      const b = points[i]!
      const c = points[(i + 1) % points.length]!
      if (Math.abs((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) < epsilon) {
        points.splice(i, 1)
        changed = true
        break
      }
    }
  }
  const curve: RenderPathPoint[] = []
  for (let i = 0; i < points.length; i++) {
    const a = points[(i + points.length - 1) % points.length]!
    const b = points[i]!
    const c = points[(i + 1) % points.length]!
    const before = Math.hypot(a.x - b.x, a.y - b.y)
    const after = Math.hypot(c.x - b.x, c.y - b.y)
    const r = Math.min(radius, before / 2, after / 2)
    const from = {x: b.x + (a.x - b.x) * r / before, y: b.y + (a.y - b.y) * r / before}
    const to = {x: b.x + (c.x - b.x) * r / after, y: b.y + (c.y - b.y) * r / after}
    for (let step = 0; step <= 6; step++) {
      const t = step / 6
      curve.push(Object.freeze({x: (1 - t) ** 2 * from.x + 2 * (1 - t) * t * b.x + t ** 2 * to.x,
        y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * b.y + t ** 2 * to.y}))
    }
  }
  const segments = curve.map((from, i) => Object.freeze({from, to: curve[(i + 1) % curve.length]!}))
    .filter(edge => edge.from.x !== edge.to.x || edge.from.y !== edge.to.y)
  return Object.freeze({cubics: Object.freeze([]), segments: Object.freeze(segments),
    bounds: Object.freeze({x: 0, y: 0, width: Math.max(...rows.map(row => row.x + row.width)) - x,
      height: rows.at(-1)!.y + rows.at(-1)!.height - y})})
}

/** Делит общую заливку по границам строк: фон каждой строки остаётся под её частью выделения. */
function contourSlice(contour: RenderPathGeometry, top: number, height: number): RenderPathGeometry {
  let points = contour.segments.map(edge => edge.from)
  for (const [level, above] of [[top, true], [top + height, false]] as const) {
    const result: RenderPathPoint[] = []
    for (let index = 0; index < points.length; index++) {
      const from = points[index]!
      const to = points[(index + 1) % points.length]!
      const fromInside = above ? from.y >= level : from.y <= level
      const toInside = above ? to.y >= level : to.y <= level
      if (fromInside) result.push(from)
      if (fromInside !== toInside) result.push({x: from.x + (to.x - from.x) * (level - from.y) / (to.y - from.y), y: level})
    }
    points = result
  }
  points = points.map(point => Object.freeze({x: point.x, y: point.y - top}))
  const segments = points.map((from, index) => Object.freeze({from, to: points[(index + 1) % points.length]!}))
    .filter(edge => edge.from.x !== edge.to.x || edge.from.y !== edge.to.y)
  return Object.freeze({cubics: Object.freeze([]), segments: Object.freeze(segments),
    bounds: Object.freeze({x: 0, y: 0, width: contour.bounds.width, height})})
}
