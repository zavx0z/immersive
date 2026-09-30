

/** Геометрия в CSS px принимающей области; размер положительный, координаты конечные. */
export interface WindowGeometry {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

/** Дополнительное действие шапки. Подпись остаётся доступным именем и подсказкой иконки. */
export interface WindowAction {
  readonly key: string
  readonly label: string
  readonly iconSrc?: string | undefined
  readonly disabled?: boolean | undefined
}
