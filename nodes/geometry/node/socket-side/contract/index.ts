import type {Socket as CoreSocket} from "@nodes/tree"
import type {SocketValuesSide} from "@socket-values/side"

/** Сохраняет принятую сторону Layout либо сторону модели сокета. */
export declare namespace NodeGeometrySocketSide {
  type Input = readonly [nodeId: string, socket: CoreSocket, resolvedSocketSides?: ReadonlyMap<string, SocketValuesSide.Output>]
  type Output = SocketValuesSide.Output
}
