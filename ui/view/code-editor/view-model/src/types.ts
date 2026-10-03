/**
Тип NormalizedToken принадлежит контракту своего владельца.
*/
export type NormalizedToken = Readonly<{
  s: number
  e: number
  c: string
  fg?: string | undefined
  bg?: string | undefined
}>
