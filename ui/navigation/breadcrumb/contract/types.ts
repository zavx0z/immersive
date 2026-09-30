

/**
Тип BreadcrumbsItem принадлежит контракту своего владельца.
*/
export type BreadcrumbsItem = Readonly<{
  id: string
  label: string
  /** Заменяет видимую подпись иконкой; label сохраняется как доступное имя и подсказка. */
  iconSrc?: string | undefined
  title?: string | undefined
  disabled?: boolean | undefined
}>

/**
Тип NormalizedBreadcrumbsItem принадлежит контракту своего владельца.
*/
export type NormalizedBreadcrumbsItem = BreadcrumbsItem & Readonly<{
  current: boolean
  separated: boolean
}>
