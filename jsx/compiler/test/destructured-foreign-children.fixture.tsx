import type {JSX} from "@jsx/types"

export function ForeignChildren({content: children}: Readonly<{
  content: JSX.Element
}>) {
  return <section>{children}</section>
}
