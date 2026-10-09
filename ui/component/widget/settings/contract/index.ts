import type {SettingsSection} from "./types"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {ImmersiveUiComponentWidget} from "@zavx0z/immersive-ui-component-widget/contract"

/** Настройки объединяют разделы и их содержимое в одной панели. */
export declare namespace ImmersiveUiComponentWidgetSettings {
  /** Выбор принадлежит приложению; виджет не читает и не сохраняет настройки. */
  interface Input {
    readonly label?: string | undefined
    readonly sections: readonly SettingsSection[]
    readonly selectedId: string
    readonly onSelect?: ((id: string, event: Event) => void) | undefined
    readonly style?: CssStyle | undefined
  }

  /** Содержимое сохраняет свой Document, состояние и собственный жизненный цикл. */
  interface Slots {
    readonly default?: readonly (JSX.Element | string | number | bigint | null | undefined)[]
  }

  type Output = ImmersiveUiComponentWidget.Output & JSX.Element<Slots>
}
