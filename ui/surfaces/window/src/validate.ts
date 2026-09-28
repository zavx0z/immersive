import type {WindowProps} from "../contract/input.ts"

/** Отклоняет неоднозначный адрес, неконечную геометрию и повторяющиеся ключи действий. */
export function validateWindow(props: WindowProps): void {
  if (!props.id?.trim()) throw new TypeError("Window id must not be empty")
  if (typeof props.title !== "string") throw new TypeError("Window title must be a string")
  if (typeof props.open !== "boolean") throw new TypeError("Window open must be a boolean")
  for (const size of [props.minWidth, props.minHeight, props.geometry?.width, props.geometry?.height]) {
    if (size !== undefined && (!Number.isFinite(size) || size <= 0)) throw new TypeError("Window size must be positive and finite")
  }
  for (const point of [props.geometry?.x, props.geometry?.y]) {
    if (point !== undefined && !Number.isFinite(point)) throw new TypeError("Window position must be finite")
  }
  const keys = new Set<string>()
  for (const action of props.actions ?? []) {
    if (!action.key || keys.has(action.key)) throw new TypeError("Window action keys must be non-empty and unique")
    keys.add(action.key)
  }
}
