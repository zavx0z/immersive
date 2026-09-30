

/** Частная подготовка привязка к шагу числового значения. */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value)
}
