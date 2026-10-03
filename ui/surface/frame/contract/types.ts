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
