import type {ComposeSlotInput} from "@zavx0z/immersive-component/slot"
import {composeSlot} from "@zavx0z/immersive-component/slot"

export function PreparedContent(props: ComposeSlotInput) {
  const content = composeSlot({content: props.content})
  return <section>{content}</section>
}

import type {ComponentValue} from "@zavx0z/immersive-component"

type MixedContent = ComponentValue | string | number | bigint | boolean | null | undefined

export function MixedPreparedContent(props: {content: MixedContent}) {
  return <section>{props.content}</section>
}

function PreparedReceiver() {
  return <main><slot /></main>
}

export function NestedPreparedContent(props: {content: MixedContent}) {
  return <PreparedReceiver>{props.content}</PreparedReceiver>
}
