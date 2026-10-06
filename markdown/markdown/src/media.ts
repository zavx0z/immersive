import {createContext} from "@zavx0z/immersive-component"

export type MarkdownImageSource = Readonly<{src: string, alt: string, title?: string}>
export type MarkdownImageLease = Readonly<{url: string, width: number, height: number, release(): void}>
/** Host документа может предоставить авторизованную доставку, bounded preview и открытие original. */
export type MarkdownMediaHost = Readonly<{
  /** Политика host для ссылок документа; чат сохраняет текущую беседу в своей вкладке. */
  linkTarget?: "_blank" | "_self"
  loadImage(image: MarkdownImageSource, signal: AbortSignal): Promise<MarkdownImageLease>
  openImage?(image: MarkdownImageSource): void
}>
export const MarkdownMediaContext = createContext<MarkdownMediaHost | null>(null)
