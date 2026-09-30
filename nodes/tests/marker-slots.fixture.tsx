import {Arrow} from "@immersive/nodes/marker/arrow"
import type {MarkerProps} from "@immersive/nodes/marker"

export function FilledMarker(props: MarkerProps) {
  return <Arrow
    context={props.context}
    variant="filled"
  />
}
