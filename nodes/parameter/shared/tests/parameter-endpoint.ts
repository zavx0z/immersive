import type {NodesSockets} from "@nodes/sockets"

/** Данные Socket для авторской JSX-композиции в проверках проекции. */
export type ParameterEndpoint = Readonly<Pick<NodesSockets.Input,
  "id" | "kind" | "direction" | "side" | "label" | "title" | "shape" |
  "connected" | "selected" | "disabled"
>>
