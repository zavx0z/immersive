/** Общий результат числовых политик раскладки измеренного графа. */
export declare namespace NodesLayout {
  /** Направление, границы и абсолютные прямоугольники нод; маршруты и порты уточняет политика. */
  interface Output {
    readonly direction: "RIGHT" | "DOWN"
    readonly bounds: Readonly<{
      x: number
      y: number
      width: number
      height: number
    }>
    readonly nodes: readonly (Output["bounds"] & Readonly<{id: string}>)[]
  }
}
