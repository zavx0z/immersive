import {Arrow} from "@immersive/nodes/markers/arrow"
import type {MarkerProps} from "@immersive/nodes/markers"

export function FilledMarker(props: MarkerProps) {
  return <Arrow
    context={props.context}
    variant="filled"
  />
}
