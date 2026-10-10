import {component} from "@zavx0z/immersive-component/authoring"
import type {DOMComponentConstructor} from "@zavx0z/immersive-dom"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
import type {MarkerComponent, MarkerContext, MarkerProps} from "./contracts.ts"

export type MarkerChildren = JSX.Element | readonly JSX.Element[] | null | undefined

/** Та же публичная граница compiled component transport, что у GraphView.view; DOM-типы не приводятся. */
export function renderMarker(marker: MarkerComponent, context: MarkerContext): MarkerChildren {
  return component(marker as unknown as DOMComponentConstructor<MarkerProps>, {context}, context.side) as unknown as JSX.Element
}
