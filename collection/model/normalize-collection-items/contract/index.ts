import type {CollectionItemShape} from "./types"


/** Нормализация элементов коллекции. */
export declare namespace UiFieldsCollectionModelNormalizeCollectionItems {
  /** Аргументы публичной операции normalizeCollectionItems; порядок сохраняет её форму вызова. */
  type Input<T extends CollectionItemShape = CollectionItemShape> = readonly [
    items: readonly T[],
    selectedId: string | null
  ]

  /** Результат публичной операции. */
  type Output<T extends CollectionItemShape = CollectionItemShape> = readonly T[]
}
