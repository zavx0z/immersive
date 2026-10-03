import type {UiWidgetsInspector} from "@ui-widgets/inspector"

/** Протокол самостоятельной операции. */
export declare namespace UiWidgetsInspectorIsInspectorPanelVisible {
  type Input = readonly [
    categories: UiWidgetsInspector.Input["categories"],
    selectedCategoryId: string,
    query: string,
    panel: Readonly<{id: string, label: string}>
  ]

  type Output = boolean
}
