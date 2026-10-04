/** Выбирает базовую высоту коллекции по видимым строкам и колонке доступных действий. */
export declare namespace ImmersiveUiFieldMetricCollectionHeight {
  /** Аргументы публичной операции collectionFieldHeight; порядок сохраняет её форму вызова. */
  type Input = readonly [
    visibleRows: number,
    movable: boolean
  ]

  /** Результат публичной операции. */
  type Output = number
}
