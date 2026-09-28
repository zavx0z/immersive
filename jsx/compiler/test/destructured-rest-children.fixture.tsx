import type {JSX} from "@jsx/types"

export function RestChildren({...props}: Readonly<{
  children: JSX.Element
}>) {
  return <section>{props.children}</section>
}
