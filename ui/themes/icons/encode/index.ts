/**
SVG-значок svg в формате data URL.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {SvgIconInput} from "./contract/input"

const svgIcon = (source: SvgIconInput): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`

export default svgIcon

export type {SvgIconInput} from "./contract/input"
