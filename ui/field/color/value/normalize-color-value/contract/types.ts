

/**
Тип ColorChannel принадлежит контракту своего владельца.
*/
export type ColorChannel = "r" | "g" | "b" | "a"

/**
Тип ColorValue принадлежит контракту своего владельца.
*/
export type ColorValue = Readonly<Record<ColorChannel, number>>

/**
Тип ColorHsva принадлежит контракту своего владельца.
*/
export type ColorHsva = Readonly<{h: number; s: number; v: number; a: number}>
