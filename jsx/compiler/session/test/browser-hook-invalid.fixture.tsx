import {useSpace} from "@immersive/browser"

export function Invalid(props: {enabled: boolean}) {
  if (props.enabled) useSpace(state => state.size)
  return <div />
}
