/**
Тип InspectorCategory принадлежит контракту своего владельца.
*/
export type InspectorCategory = Readonly<{
  id: string
  label: string
  iconSrc?: string | undefined
  title?: string | undefined
  disabled?: boolean | undefined
  groupStart?: boolean | undefined
  panelIds?: readonly string[] | undefined
}>

/**
Тип InspectorAction принадлежит контракту своего владельца.
*/
export type InspectorAction = Readonly<{
  id: string
  label: string
  iconSrc: string
  title?: string | undefined
  disabled?: boolean | undefined
  selected?: boolean | undefined
  action?: ((event: Event) => void) | undefined
}>

/**
Тип InspectorContextRow принадлежит контракту своего владельца.
*/
export type InspectorContextRow = Readonly<{
  label: string
  iconSrc?: string | undefined
  title?: string | undefined
  actions?: readonly InspectorAction[] | undefined
}>

/**
Тип InspectorContext принадлежит контракту своего владельца.
*/
export type InspectorContext = InspectorContextRow & Readonly<{
  secondary?: InspectorContextRow | undefined
}>
