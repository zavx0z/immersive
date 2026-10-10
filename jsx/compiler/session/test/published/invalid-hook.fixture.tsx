import {useState as state} from "@zavx0z/immersive/XReact"

export function Invalid(props: {enabled: boolean}) {
  if (props.enabled) state(0)
  return <section />
}
