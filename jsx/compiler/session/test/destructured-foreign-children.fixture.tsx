import type {JSX} from "@immersive-jsx-compiler/session"

export function ForeignChildren({content: children}: Readonly<{
  content: JSX.Element
}>) {
  return <section>{children}</section>
}
