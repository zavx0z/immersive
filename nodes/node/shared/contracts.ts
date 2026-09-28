import type {JsxSourceElement} from "@zavx0z/template/jsx-runtime"

export type NodeRect = Readonly<{x: number; y: number; width: number; height: number}>

export type NodeKind = "parameter" | "content" | "diagram"
export type NodeShape = "rectangle" | "oval" | "circle"
export type NodeChildren = JsxSourceElement | readonly JsxSourceElement[] | null | undefined
export type NodeAction = Readonly<{id: string; label: string; iconSrc: string; selected?: boolean | undefined; disabled?: boolean | undefined; onClick?: ((event: Event) => void) | undefined}>
