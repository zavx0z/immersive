import type {ComponentValue} from "@zavx0z/immersive-component"

export function Invalid(props: {content: Partial<ComponentValue>}) {
  // @ts-expect-error Необязательный nominal brand не подтверждает ComponentValue.
  return <section>{props.content}</section>
}
