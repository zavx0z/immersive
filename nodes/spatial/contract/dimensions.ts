/** Физический масштаб графа и место для прикладной поверхности. */
export type SpatialGraphDimensions = Readonly<{
  millimetersPerPixel?: number | undefined
  contentSurface?: Readonly<{width: number; height: number}> | undefined
}>
