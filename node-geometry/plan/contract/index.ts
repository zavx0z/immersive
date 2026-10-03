import type {NodeGeometryRowInput, NodeGeometryRow} from "./types"

/** Планирует размеры ноды и центры сокетов по высотам строк. */
export declare namespace NodeGeometryPlan {
  type Input = Readonly<{
    width?: number | undefined
    rows: readonly NodeGeometryRowInput[]
    collapsed?: boolean | undefined
    contentVisible?: boolean | undefined
  }>

  type Output = Readonly<{
    width: number
    height: number
    contentHeight: number
    rows: readonly NodeGeometryRow[]
    sockets: readonly Readonly<{id: string; y: number}>[]
  }>
}
