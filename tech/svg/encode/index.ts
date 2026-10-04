/**
SVG-значок svg в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {ImmersiveTechSvgEncode as Contract} from "./contract"

const svgIcon = (source: Contract.Input): Contract.Output =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`

export default svgIcon

export type {ImmersiveTechSvgEncode} from "./contract"
