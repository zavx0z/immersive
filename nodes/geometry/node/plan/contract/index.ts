import type {RowInput, Row} from "./types"

/** Планирует размеры ноды и центры сокетов по высотам строк. */
export declare namespace Zavx0zImmersiveNodesGeometryNodePlan {
  type Input = Readonly<{
    width?: number | undefined
    rows: readonly RowInput[]
    collapsed?: boolean | undefined
    contentVisible?: boolean | undefined
  }>

  type Output = Readonly<{
    width: number
    height: number
    contentHeight: number
    rows: readonly Row[]
    sockets: readonly Readonly<{id: string; y: number}>[]
  }>
}
