/**
Собирает SVG data URL размером 24×24 из векторного содержимого и цвета штрихов.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveUiThemeIconCompose as Contract} from "./contract"
import svgIcon from "@zavx0z/immersive-tech-svg-encode"

export default function iconSvg(body: Contract.Input[0], color: Contract.Input[1] = "#fff"): Contract.Output {
  return svgIcon(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`)
}

export type {ImmersiveUiThemeIconCompose} from "./contract"
