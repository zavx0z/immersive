/** Резерв освобождается только ниже quarter watermark; активные данные не обрезаются. */
export function trimmedResourceCapacity(current: number, required: number, minimum: number): number {
  if (current <= minimum || required > current / 4) return current
  let target = Math.max(1, minimum)
  while (target < required) target *= 2
  return target
}
