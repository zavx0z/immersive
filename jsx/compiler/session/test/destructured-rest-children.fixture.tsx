import type {JSX} from "@jsx-compiler/session"

export function RestChildren({...props}: Readonly<{
  children: JSX.Element
}>) {
  return <section>{props.children}</section>
}
