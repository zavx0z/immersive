

/**
Тип ReferenceFieldValue принадлежит контракту своего владельца.
*/
export type ReferenceFieldValue = Readonly<{ id: string; label: string; kind?: string | undefined }>

/**
Тип ReferenceFieldDensity принадлежит контракту своего владельца.
*/
export type ReferenceFieldDensity = "regular" | "compact"
