import type {SocketValuesKinds} from "@socket-values/kinds"
import type {SocketValuesPresets} from "@socket-values/presets"

/** Выбирает предустановку известного вида сокета. */
export declare namespace SocketValuesPreset {
  type Input = SocketValuesKinds.Output[number]
  type Output = SocketValuesPresets.Output[Input]
}
