import type {FrameProps} from "./input.ts"

/**
Тип FrameEdge принадлежит контракту своего владельца.
*/
export type FrameEdge = "floating" | "left" | "right" | "top" | "bottom"

/**
Тип FrameHandle принадлежит контракту своего владельца.
*/
export type FrameHandle = Readonly<{
  key: string
  label: string
  iconSrc?: string | undefined
  disabled: boolean
}>

/**
Тип FrameDefaultProps принадлежит контракту своего владельца.
*/
export type FrameDefaultProps = Pick<FrameProps, "title" | "edge" | "handles">

/**
Тип FrameHandleButtonProps принадлежит контракту своего владельца.
*/
export type FrameHandleButtonProps = Readonly<{
  handle: FrameHandle
  onHandle?: FrameProps["onHandle"]
}>
