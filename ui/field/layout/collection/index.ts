/**
Числовой договор размеров collectionField.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import resolveCollectionFieldHeight from "@immersive-ui-field-metric/collection-height"
import normalizeCollectionVisibleRows from "@immersive-ui-field-collection-model/normalize-visible-rows"

const collectionFieldLayout = Object.freeze({
  height(options: Readonly<{
    visibleRows?: number | undefined
    movable?: boolean | undefined
  }> = {}): number {
    return resolveCollectionFieldHeight(
      normalizeCollectionVisibleRows(options.visibleRows),
      options.movable === true
    )
  }
})

export default collectionFieldLayout
