/** Неотрицательные расстояния в логических пикселях, без зависимости от viewport. */
export interface HierarchyLayoutOptions {
  /** Расстояние между горизонтальными областями соседних поддеревьев. По умолчанию 24. */
  readonly siblingSpacing?: number
  /** Свободная полоса между слоями. По умолчанию 64. */
  readonly layerSpacing?: number
}

