import type {LayoutNode} from "../../../protocol/types/src/protocol.ts"

/** Компактная упаковка измеренных карточек и вложенных контейнеров. */
export interface CompoundLayoutInput {
  /** Лист сохраняет размер; контейнер расширяется для children после contentHeight. */
  readonly nodes: readonly LayoutNode[]
  readonly options?: Readonly<{
    /** Зазор между соседями. По умолчанию 24. */
    spacing?: number
    /** Отступ детей от рамки контейнера и собственного content. По умолчанию 24. */
    padding?: number
    /** Отступ корней от общих bounds. По умолчанию 0. */
    outerPadding?: number
    /** Желаемое отношение ширины к высоте каждой группы. По умолчанию 1.5. */
    aspectRatio?: number
  }>
}
