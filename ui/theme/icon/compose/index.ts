/**
Сборка SVG-значка из векторного содержимого.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {IconSvgInput} from "./contract/input"
import svgIcon from "@ui-themes-icons/encode"

export default function iconSvg(body: IconSvgInput[0], color: IconSvgInput[1] = "#fff"): string {
  return svgIcon(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`)
}

export type {IconSvgInput} from "./contract/input"
