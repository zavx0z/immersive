
/** Протокол самостоятельной операции. */
export declare namespace ImmersiveUiSurfaceAssertActions {
  type Input = readonly [
    items: readonly Readonly<{key: string, label: string, disabled: boolean}>[],
    owner: string
  ]

  type Output = void
}
