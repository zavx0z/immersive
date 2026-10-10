import {useSpace as space} from "@zavx0z/immersive/XReact/browser"

export function Invalid(props: {enabled: boolean}) {
  if (props.enabled) space(state => state)
  return <section />
}
