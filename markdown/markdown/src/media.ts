import {createContext} from "@zavx0z/immersive-component"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

export type MarkdownImageSource = Readonly<{src: string, alt: string, title?: string}>
export type MarkdownImageLease = Readonly<{url: string, width: number, height: number, release(): void}>
/** Host документа может предоставить авторизованную доставку, bounded preview и открытие original. */
export type MarkdownMediaHost = Readonly<{
  /** Политика host для ссылок документа; чат сохраняет текущую беседу в своей вкладке. */
  linkTarget?: "_blank" | "_self"
  /**
  Собственный компонент inline-изображения в том же Document. Markdown передаёт
  проверенный parser адрес и сохраняет окружающие текст/inline узлы. Caller
  владеет загрузкой, visibility, lease, ошибкой и retry; стандартный loadImage
  для этой ветки не вызывается. Результат компонуется через compiler-owned slot.
  Без renderer сохраняется стандартное представление и его lifecycle.
  */
  renderImage?(image: MarkdownImageSource): JSX.Element
  loadImage(image: MarkdownImageSource, signal: AbortSignal): Promise<MarkdownImageLease>
  openImage?(image: MarkdownImageSource): void
}>
export const MarkdownMediaContext = createContext<MarkdownMediaHost | null>(null)
