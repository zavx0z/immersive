export function Invalid(props: {content: Readonly<{"@zavx0z/immersive-component/value"?: false}>}) {
  // @ts-expect-error Ложная метка не является ComponentValue.
  return <section>{props.content}</section>
}
