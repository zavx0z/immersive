import type {UiFeedbackStatusBar} from "@ui-feedback/status-bar"

/** Протокол самостоятельной операции. */
export declare namespace UiFeedbackStatusBarStatusBarText {
  type Input = readonly [
    items: readonly NonNullable<UiFeedbackStatusBar.Input["start"]>[number][],
    separator?: string
  ]

  type Output = string
}
