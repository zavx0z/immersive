import {useEffect, useSyncExternalStore} from "@zavx0z/immersive-component"
import type {MarkdownImageSource} from "../src/media.ts"

export type CallerImageProps = Readonly<{
  image: MarkdownImageSource
  store: Readonly<{getSnapshot(): boolean, subscribe(listener: () => void): () => void}>
  mounted(): void
  disposed(): void
}>

/** Авторский компонент получает только публичный source и владеет своим src/lifecycle. */
export default function CallerImage(props: CallerImageProps) {
  const active = useSyncExternalStore(props.store.subscribe, props.store.getSnapshot)
  useEffect(() => {props.mounted(); return props.disposed}, [])
  return <img
    data-caller-image=""
    src={active ? "provided:thumbnail" : undefined}
    alt={props.image.alt}
    title={props.image.title}
    width={240}
    height={120}
    style={css`
      display: block;
    `}
  />
}
