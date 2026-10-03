import type {SocketValuesKinds} from "@socket-values/kinds"
import type {SocketValuesShapes} from "@socket-values/shapes"

/** Именованные цветовые и геометрические предустановки сокетов. */
export declare namespace SocketValuesPresets {
  type Output = Readonly<Record<SocketValuesKinds.Output[number], Readonly<{
    kind: SocketValuesKinds.Output[number]
    label: string
    color: string
    shape: SocketValuesShapes.Output[number]
  }>>>
}
