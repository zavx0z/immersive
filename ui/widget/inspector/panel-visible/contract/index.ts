import type {ImmersiveUiComponentWidgetInspector} from "@immersive-ui-component-widget/inspector"

/** Протокол самостоятельной операции. */
export declare namespace ImmersiveUiWidgetInspectorPanelVisible {
  type Input = readonly [
    categories: ImmersiveUiComponentWidgetInspector.Input["categories"],
    selectedCategoryId: string,
    query: string,
    panel: Readonly<{id: string, label: string}>
  ]

  type Output = boolean
}
