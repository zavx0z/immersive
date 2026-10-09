import type {SpatialHit} from "../contract/spatial-hit.ts"

const eventHits = new WeakMap<object, SpatialHit>()

/** Browser привязывает geometric hit к событию того же semantic Document. */
export function bindSpatialHit(event: object, hit: SpatialHit): void {
  eventHits.set(event, hit)
}

/** Читает адрес ребра из обычного bubbling pointer/click event без private Engine. */
export function readSpatialHit(event: object): SpatialHit | null {
  return eventHits.get(event) ?? null
}
