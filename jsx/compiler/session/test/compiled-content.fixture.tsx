import type {DOMSlotContent} from "@zavx0z/immersive-dom"

export function PreparedContent(props: {content?: DOMSlotContent}) {
  return <section>{props.content}</section>
}

type MixedContent = DOMSlotContent

export function MixedPreparedContent(props: {content: MixedContent}) {
  return <section>{props.content}</section>
}

function PreparedReceiver() {
  return <main><slot /></main>
}

export function NestedPreparedContent(props: {content: MixedContent}) {
  return <PreparedReceiver>{props.content}</PreparedReceiver>
}
