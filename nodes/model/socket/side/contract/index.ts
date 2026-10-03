import type {Socket as CoreSocket} from "@nodes/tree"

/** Определяет сторону сокета по явному значению и направлению. */
export declare namespace SocketValuesSide {
  type Input = Pick<CoreSocket, "direction" | "side">
  type Output = NonNullable<CoreSocket["side"]>
}
