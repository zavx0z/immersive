/** Плоский прямоугольник в XY, нижний левый угол; Z постоянна. */
export interface Rectangle {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly width: number
  readonly height: number
}
