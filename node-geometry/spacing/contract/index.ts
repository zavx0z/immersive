import type {NodesParameterPresentation} from "@nodes/parameter-presentation"

/** Читает и проверяет интервал перед параметром. */
export declare namespace NodeGeometrySpacing {
  type Input = NodesParameterPresentation.Input
  type Output = "small" | "medium" | undefined
}
