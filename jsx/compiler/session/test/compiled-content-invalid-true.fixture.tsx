export function Invalid(props: {content: Readonly<{"@zavx0z/immersive-component/value"?: true}>}) {
  // @ts-expect-error Поддельная метка не является ComponentValue.
  return <section>{props.content}</section>
}
