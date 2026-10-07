import type {ImmersiveUiComponentSurface} from "@zavx0z/immersive-ui-component-surface/contract"
import type {PanelAction} from "./types.ts"

import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

/** Вход компонента и его JSX-представление. */
export declare namespace ImmersiveUiComponentSurfacePanel {
  /**
  Входные данные Panel.
  */
  interface Input {
    readonly label: string
    readonly title?: string | undefined
    readonly expanded: boolean
    /** Необязательный флажок перед подписью; не управляет раскрытием панели. */
    readonly checked?: boolean | undefined
    readonly checkDisabled?: boolean | undefined
    readonly onCheckedChange?: ((checked: boolean, event: Event) => void) | undefined
    readonly hidden?: boolean | undefined
    readonly actions?: readonly PanelAction[] | undefined
    /** Оформление: --panel-radius, --panel-header-inset, --panel-header-background,
    --panel-content-padding и --panel-content-background настраивают блок без изменения полей внутри. */
    readonly style?: CssStyle | undefined
    readonly onToggle?: ((expanded: boolean, event: Event) => void) | undefined
  }

  /** Содержимое вызывающей стороны размещается в том же Document. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentSurface.Output & JSX.Element<Slots>
}
