import type {NodesSockets} from "@nodes/sockets"
type SocketKind = NodesSockets.Input["kind"]
type SocketDirection = NodesSockets.Input["direction"]
type SocketShape = NonNullable<NodesSockets.Input["shape"]>
type SocketSide = NodesSockets.Input["side"]

/** Адресуемый сокет авторского параметра с уже выбранной стороной и внешним состоянием. */
export type ParameterEndpoint = Readonly<{
  id: string
  kind: SocketKind
  direction: SocketDirection
  side: SocketSide
  label: string
  title?: string | undefined
  shape?: SocketShape | undefined
  connected?: boolean | undefined
  selected?: boolean | undefined
  disabled?: boolean | undefined
}>
