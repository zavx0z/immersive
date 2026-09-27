import type {TabProps} from "../contract/input.ts"

/** Сторона и нормализованное положение не зависят от HUD, Display или масштаба камеры. */
export type TabPosition = NonNullable<TabProps["position"]>
/** Локальные размеры области перетаскивания в CSS px. */
export type TabArea = Readonly<{width: number; height: number}>
/** Измеренный CSS-размер и необязательные авторские ограничения. */
export type TabSizing = Readonly<{size: TabArea; length: number | undefined; thickness: number | undefined}>

/** Проверяет объявленное положение и подставляет правый край по умолчанию. */
export function readTabPosition(value: TabProps["position"]): TabPosition {
  const position = value ?? {edge: "right", offset: .5}
  if (!["left", "right", "top", "bottom"].includes(position.edge) ||
    !Number.isFinite(position.offset) || position.offset < 0 || position.offset > 1) {
    throw new RangeError("Tab position requires an edge and an offset between 0 and 1")
  }
  return Object.freeze({...position})
}

/** Располагает таб на краю, ограничивая его размеры доступной областью. */
export function tabRect(position: TabPosition, area: TabArea, sizing: TabSizing) {
  const vertical = position.edge === "left" || position.edge === "right"
  const width = Math.min(area.width, (vertical ? sizing.thickness : sizing.length) ?? sizing.size.width)
  const height = Math.min(area.height, (vertical ? sizing.length : sizing.thickness) ?? sizing.size.height)
  return {
    width,
    height,
    x: position.edge === "left" ? 0 : position.edge === "right" ? area.width - width : (area.width - width) * position.offset,
    y: position.edge === "top" ? 0 : position.edge === "bottom" ? area.height - height : (area.height - height) * position.offset,
  }
}

/** Выбирает ближайший край по центру переносимого таба; равенство сохраняет текущую сторону. */
export function dockTab(center: Readonly<{x: number; y: number}>, area: TabArea, preferred: TabPosition["edge"], sizing: TabSizing): TabPosition {
  const x = Math.max(0, Math.min(area.width, center.x))
  const y = Math.max(0, Math.min(area.height, center.y))
  const distances = {left: x, right: area.width - x, top: y, bottom: area.height - y}
  let edge = preferred
  for (const candidate of ["left", "right", "top", "bottom"] as const) {
    if (distances[candidate] < distances[edge]) edge = candidate
  }
  const rect = tabRect({edge, offset: 0}, area, sizing)
  const vertical = edge === "left" || edge === "right"
  const extent = vertical ? area.height - rect.height : area.width - rect.width
  const offset = extent <= 0 ? 0 : ((vertical ? y : x) - (vertical ? rect.height : rect.width) / 2) / extent
  return Object.freeze({edge, offset: Math.max(0, Math.min(1, offset))})
}
