

/**
Входные данные SurfaceTitle.
*/
export interface SurfaceTitleProps {
  readonly text: string
  readonly variant?: "title" | "subtitle" | undefined
  readonly style?: CssStyle | undefined
}
