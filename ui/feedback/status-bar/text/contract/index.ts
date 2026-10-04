import type {ImmersiveUiComponentFeedbackStatusBar} from "@zavx0z/immersive-ui-component-feedback-status-bar"

/** Протокол самостоятельной операции. */
export declare namespace ImmersiveUiFeedbackStatusBarText {
  type Input = readonly [
    items: readonly NonNullable<ImmersiveUiComponentFeedbackStatusBar.Input["start"]>[number][],
    separator?: string
  ]

  type Output = string
}
