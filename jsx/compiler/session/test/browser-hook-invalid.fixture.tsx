import {useSpace} from "@zavx0z/immersive-browser"

export function Invalid(props: {enabled: boolean}) {
  if (props.enabled) useSpace(state => state.size)
  return <div />
}
