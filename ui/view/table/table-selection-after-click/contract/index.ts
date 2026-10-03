/** Выбор строк после обычного, добавляющего или диапазонного жеста. */
export declare namespace UiViewsTableTableSelectionAfterClick {
  /** Порядок доступных строк, текущий выбор, цель, якорь и модификаторы жеста. */
  type Input = readonly [
    rowKeys: readonly string[],
    currentSelectedKeys: readonly string[],
    clickedKey: string,
    anchorKey: string | null,
    gesture?: Readonly<{
      metaKey?: boolean | undefined
      ctrlKey?: boolean | undefined
      shiftKey?: boolean | undefined
    }>
  ]

  /** Новый выбор и сохраняемый якорь диапазона. */
  type Output = Readonly<{
    selectedKeys: readonly string[]
    anchorKey: string
  }>
}
