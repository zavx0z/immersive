import type {ImmersiveNodesSocket} from "@zavx0z/immersive-nodes-socket"

/** Данные Socket для авторской JSX-композиции в проверках проекции. */
export type ParameterEndpoint = Readonly<Pick<ImmersiveNodesSocket.Input,
  "id" | "kind" | "direction" | "side" | "label" | "title" | "shape" |
  "connected" | "selected" | "disabled"
>>
