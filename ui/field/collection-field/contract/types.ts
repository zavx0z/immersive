

/**
Тип CollectionFieldItem принадлежит контракту своего владельца.
*/
export type CollectionFieldItem = Readonly<{
  id: string
  label: string
  iconSrc?: string | undefined
  description?: string | undefined
  disabled?: boolean | undefined
}>

/**
Тип CollectionFieldDensity принадлежит контракту своего владельца.
*/
export type CollectionFieldDensity = "regular" | "compact"

/**
Тип CollectionFieldMoveDirection принадлежит контракту своего владельца.
*/
export type CollectionFieldMoveDirection = "up" | "down"
