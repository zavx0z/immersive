import type {CellStyle} from "../contract/types.ts"

/** Частная подготовка модель терминального вывода, управляющих последовательностей и ответов. */
export const normal: CellStyle = Object.freeze({foreground: null, background: null, bold: false})

/** Частная подготовка модель терминального вывода, управляющих последовательностей и ответов. */
export const colors = Object.freeze(["#0b0f16", "#ff5a5f", "#5fcb6b", "#f6c453", "#4aa3ff", "#c678dd", "#56d4dd", "#d7dde7"])

/** Частная подготовка модель терминального вывода, управляющих последовательностей и ответов. */
export function sameStyle(left: CellStyle, right: CellStyle): boolean {
  return left.foreground === right.foreground && left.background === right.background && left.bold === right.bold
}

/** Частная подготовка модель терминального вывода, управляющих последовательностей и ответов. */
export function sgr(current: CellStyle, params: readonly number[]): CellStyle {
  let next = {...current}
  for (const code of params.length ? params : [0]) {
    if (code === 0) next = {...normal}
    else if (code === 1) next.bold = true
    else if (code === 22) next.bold = false
    else if (code === 39) next.foreground = null
    else if (code === 49) next.background = null
    else if (code >= 30 && code <= 37) next.foreground = colors[code - 30]!
    else if (code >= 40 && code <= 47) next.background = colors[code - 40]!
    else if (code >= 90 && code <= 97) next.foreground = brighten(colors[code - 90]!)
    else if (code >= 100 && code <= 107) next.background = brighten(colors[code - 100]!)
  }
  return Object.freeze(next)
}

/** Частная подготовка модель терминального вывода, управляющих последовательностей и ответов. */
export function brighten(color: string): string {
  return `#${[1, 3, 5].map(offset => Math.min(255, parseInt(color.slice(offset, offset + 2), 16) + 48).toString(16).padStart(2, "0")).join("")}`
}
