import {useSpace} from "@zavx0z/immersive/XReact"

export function Invalid(props: {enabled: boolean}) {
  if (props.enabled) useSpace(state => state.size)
  return <div />
}
