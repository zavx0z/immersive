import type {GraphRect} from "../../shared/graph/contracts.ts"
import type {SpatialGraphDimensions} from "../contract/dimensions.ts"

/** Один пиксель готовой геометрии — четверть миллиметра общего Space. */
export const SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL = .25
export const SPATIAL_GRAPH_CONTENT_SURFACE = Object.freeze({width: 20, height: 12.5})
export const SPATIAL_GRAPH_NODE_SIZE = Object.freeze({width: 480, height: 96})

/** Центр и физический габарит маленького Display слева от подписи ноды. */
export function spatialContentBounds(rect: GraphRect, dimensions: SpatialGraphDimensions = {}) {
  const unit = dimensions.millimetersPerPixel ?? SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL
  const surface = dimensions.contentSurface ?? SPATIAL_GRAPH_CONTENT_SURFACE
  return Object.freeze({
    x: rect.x * unit + surface.width / 2,
    y: -.2,
    z: -(rect.y + rect.height / 2) * unit,
    width: surface.width,
    height: surface.height,
  })
}

/** Центр и габарит всего графа в мировом XZ; CSS-ось вниз становится отрицательной Z. */
export function spatialGraphBounds(rect: GraphRect, dimensions: SpatialGraphDimensions = {}) {
  const unit = dimensions.millimetersPerPixel ?? SPATIAL_GRAPH_MILLIMETERS_PER_PIXEL
  const width = Math.ceil(rect.width)
  const height = Math.ceil(rect.height)
  return Object.freeze({
    x: (rect.x + width / 2) * unit,
    y: 0,
    z: -(rect.y + height / 2) * unit,
    width: width * unit,
    height: height * unit,
  })
}
