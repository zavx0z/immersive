import type {UiThemesIcons} from "@ui-themes/icons/contract"
/** Собирает SVG data URL размером 24×24 из векторного содержимого и цвета штрихов. */
export declare namespace UiThemesIconsCompose {
  /** Аргументы публичной операции iconSvg; порядок сохраняет её форму вызова. */
  type Input = readonly [
    body: string,
    color?: string
  ]

  /** Результат публичной операции. */
  type Output = UiThemesIcons.Output
}
