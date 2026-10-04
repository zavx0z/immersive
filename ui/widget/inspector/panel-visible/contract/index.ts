import type {Zavx0zImmersiveUiComponentWidgetInspector} from "@zavx0z/immersive-ui-component-widget-inspector"

/** Протокол самостоятельной операции. */
export declare namespace Zavx0zImmersiveUiWidgetInspectorPanelVisible {
  type Input = readonly [
    categories: Zavx0zImmersiveUiComponentWidgetInspector.Input["categories"],
    selectedCategoryId: string,
    query: string,
    panel: Readonly<{id: string, label: string}>
  ]

  type Output = boolean
}
