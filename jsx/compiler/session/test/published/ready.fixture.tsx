import type {JSX} from "@zavx0z/immersive/XReact"

export function Prepared(props: {value: string}): JSX.Element<{header: JSX.Element}> {
  return <section>{props.value}<slot name="header" /></section>
}

export function PreparedDefault(props: {value: string}): JSX.Element {
  return <section>{props.value}<slot name="header" /><slot /></section>
}
