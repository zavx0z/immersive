import type {WindowGeometry} from "../contract/types"

/** Сторона resize или перемещение за шапку. */
export type WindowGesture = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw"
/** Размер принимающей проекции в CSS px. */
export interface WindowArea {width: number; height: number}

/** Ограничивает размер и положение доступной областью, включая viewport меньше минимума. */
export function fitWindow(box: WindowGeometry, area: WindowArea, minWidth: number, minHeight: number): WindowGeometry {
  if (area.width <= 0 || area.height <= 0) return box
  const width = Math.min(area.width, Math.max(minWidth, box.width))
  const height = Math.min(area.height, Math.max(minHeight, box.height))
  return {x: Math.max(0, Math.min(area.width - width, box.x)), y: Math.max(0, Math.min(area.height - height, box.y)), width, height}
}

/** Resize сохраняет противоположную сторону; все стороны остаются внутри области. */
export function dragWindow(box: WindowGeometry, kind: WindowGesture, dx: number, dy: number, area: WindowArea, minWidth: number, minHeight: number): WindowGeometry {
  if (kind === "move") return fitWindow({...box, x: box.x + dx, y: box.y + dy}, area, minWidth, minHeight)
  let left = box.x
  let top = box.y
  let right = box.x + box.width
  let bottom = box.y + box.height
  const width = Math.min(minWidth, area.width)
  const height = Math.min(minHeight, area.height)
  if (kind.includes("w")) left = Math.max(0, Math.min(right - width, left + dx))
  if (kind.includes("e")) right = Math.min(area.width, Math.max(left + width, right + dx))
  if (kind.includes("n")) top = Math.max(0, Math.min(bottom - height, top + dy))
  if (kind.includes("s")) bottom = Math.min(area.height, Math.max(top + height, bottom + dy))
  return {x: left, y: top, width: right - left, height: bottom - top}
}
