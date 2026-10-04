import type {JSX} from "@immersive-jsx-compiler/session"

/** Компоненты интерфейса создают JSX-представления в Document принимающего приложения. */
export declare namespace ImmersiveUiComponent {
  /** JSX-элемент; точные входы, слоты и события принадлежат участникам. */
  type Output = JSX.Element<object>
}
