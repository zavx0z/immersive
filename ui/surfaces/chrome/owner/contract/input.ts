

/**
Входные данные SurfaceOwner.
*/
export interface SurfaceOwnerProps {
  readonly label: string
  readonly active?: boolean | undefined
  readonly timeline?: boolean | undefined
  readonly frameStart?: number | undefined
  readonly frameEnd?: number | undefined
  readonly frameCurrent?: number | undefined
  readonly style?: CssStyle | undefined
}
