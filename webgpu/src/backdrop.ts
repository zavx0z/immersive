import type {Object3D} from "@zavx0z/immersive-engine"

/** Параметры фонового размытия в исходных CSS px прямоугольника. */
export type Backdrop = Readonly<{sigma: number, width: number, height: number}>

const backdrops = new WeakMap<Object3D, Backdrop>()

/** Читает производные параметры отдельной записи фонового размытия. */
export function readBackdrop(object: Object3D): Backdrop | undefined {
  return backdrops.get(object)
}

/** Обновляет параметры retained Mesh; undefined снимает прежнюю запись. */
export function setBackdrop(object: Object3D, value: Backdrop | undefined): void {
  if (value === undefined) {
    backdrops.delete(object)
    return
  }
  const {sigma, width, height} = value
  for (const [name, number] of [["sigma", sigma], ["width", width], ["height", height]] as const) {
    if (!Number.isFinite(number) || number < 0) {
      throw new RangeError(`Backdrop.${name} must be finite and non-negative`)
    }
  }
  const previous = backdrops.get(object)
  if (previous?.sigma === sigma && previous.width === width && previous.height === height) return
  backdrops.set(object, Object.freeze({sigma, width, height}))
}
