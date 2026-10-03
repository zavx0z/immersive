import type {SocketValuesShapes} from "@socket-values/shapes"

/** Сохраняет известную форму сокета, оставляя неизвестную неопределённой. */
export declare namespace SocketValuesResolveShape {
  type Input = string
  type Output = SocketValuesShapes.Output[number] | undefined
}
