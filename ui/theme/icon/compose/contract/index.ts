import type {ImmersiveUiThemeIcon} from "@immersive-ui-theme/icon/contract"
/** Собирает SVG data URL размером 24×24 из векторного содержимого и цвета штрихов. */
export declare namespace ImmersiveUiThemeIconCompose {
  /** Аргументы публичной операции iconSvg; порядок сохраняет её форму вызова. */
  type Input = readonly [
    body: string,
    color?: string
  ]

  /** Результат публичной операции. */
  type Output = ImmersiveUiThemeIcon.Output
}
