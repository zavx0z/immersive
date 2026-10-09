import type {Rectangle} from "./rectangle.ts"

/** Числовой протокол послойного дерева и полного объёма его ветвей. */
export declare namespace ImmersiveNodesLayoutPrismTree {
  /** Вход в единых мировых единицах; viewport и камера не участвуют в расчёте. */
  interface Input {
    /** Уникальные узлы леса. Родитель может находиться после ребёнка. */
    readonly nodes: readonly Readonly<{
      id: string
      parentId?: string
      /** Точная ширина Display, не изменяемая алгоритмом. */
      width: number
      /** Точная высота Display, включая его авторский aspect. */
      height: number
      /** Приоритет равных по размеру областей соседей, по умолчанию 1; размеры не меняет. */
      weight?: number
    }>[]
    readonly options?: Readonly<{
      /** Одинаковое расстояние между всеми XY-слоями, по умолчанию 240. */
      layerGap?: number
      /** Одинаковая глубина всех тел: 0<bodyDepth<layerGap. По умолчанию layerGap/2. */
      bodyDepth?: number
      /** Зазор между соседними прямоугольниками каждого слоя, по умолчанию 24. */
      spacing?: number
      /** Ориентир отношения ширины к высоте локальной упаковки детей, по умолчанию 1.5. */
      aspectRatio?: number
    }>
  }

  /** Каждая сущность присутствует один раз; каждый узел, включая лист, имеет тело. */
  interface Output {
    /** Узлы в исходном порядке, с точными измеренными размерами. */
    readonly nodes: readonly Readonly<{id: string; parentId?: string; depth: number; rect: Rectangle}>[]
    /** Слои возрастающей глубины; порядок nodeIds устойчив к перестановке входа. */
    readonly layers: readonly Readonly<{depth: number; z: number; nodeIds: readonly string[]; bounds: Rectangle}>[]
    /** Полное неизменное XY-сечение на глубину bodyDepth. Есть и у листьев. */
    readonly stems: readonly Readonly<{id: string; nodeId: string; top: Rectangle; bottom: Rectangle}>[]
    /** Прямоугольный loft начинается только на дальнем торце тела родителя. */
    readonly branches: readonly Readonly<{id: string; parentId: string; childId: string; from: Rectangle; to: Rectangle}>[]
    /** Земля — нижний торец самого неглубокого листа; более глубокие слои — подвал. */
    readonly floorZ: 0
    readonly groundDepth: number | null
    /** AABB всех тел и ветвей; z — минимум, depth — протяжённость вдоль Z. */
    readonly bounds: Readonly<{x: number; y: number; z: number; width: number; height: number; depth: number}>
  }
}
