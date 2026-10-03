import type {SocketValuesKinds} from "@socket-values/kinds"

/** Сохраняет известный вид сокета, заменяя неизвестный на custom. */
export declare namespace SocketValuesResolveKind {
  type Input = string
  type Output = SocketValuesKinds.Output[number]
}
