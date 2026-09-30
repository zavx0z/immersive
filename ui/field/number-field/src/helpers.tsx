import type {ActiveScrub} from "../contract/types.ts"

/** Частная подготовка поле интерфейса: числовое значение. */
export function releaseScrubCapture(active: ActiveScrub | null): void {
  if (active?.target.hasPointerCapture(active.pointerId) === true) {
    active.target.releasePointerCapture(active.pointerId)
  }
}
