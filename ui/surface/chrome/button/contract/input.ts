import type {UiButtonsButton} from "@ui-buttons/button"

/**
Входные данные SurfaceButton.
*/
export interface SurfaceButtonProps {
  readonly label: string
  readonly iconSrc?: string | undefined
  readonly iconOnly?: boolean | undefined
  readonly iconAction?: boolean | undefined
  readonly title?: string | undefined
  readonly ariaLabel?: string | undefined
  readonly expanded?: boolean | string | undefined
  readonly controls?: string | undefined
  readonly disabled?: boolean | undefined
  readonly style?: CssStyle | undefined
  readonly onClick?: UiButtonsButton.Input["onClick"]
}
