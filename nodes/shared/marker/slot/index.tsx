/**
Композиция представления маркера на одном конце существующего маршрута.

@packageDocumentation
*/

import type {MarkerComponent, MarkerContext} from "../contracts.ts"
import {renderMarker} from "../render.ts"

/** Сохраняет компонент маркера в безымянном слоте без DOM-контейнера. */
export function MarkerSlot(props: Readonly<{marker: MarkerComponent; context: MarkerContext}>) {
  const content = renderMarker(props.marker, props.context)
  return <MarkerContent>
    {content}
  </MarkerContent>
}

/** Принимает подготовленный компонент маркера через обычную вложенность JSX. */
function MarkerContent() {
  return <slot />
}
