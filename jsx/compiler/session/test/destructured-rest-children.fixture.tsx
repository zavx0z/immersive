import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

export function RestChildren({...props}: Readonly<{
  children: JSX.Element
}>) {
  return <section>{props.children}</section>
}
