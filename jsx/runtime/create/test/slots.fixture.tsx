import {useState} from "@zavx0z/immersive-component/authoring"

export function Text(props: {text: string}) { return <span>{props.text}</span> }
export function Counter(props: {text: string}) {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(value => value + 1)}>{props.text}:{count}</button>
}
export function Receiver() {
  return <article>
    <header><slot name="header"><Text text="fallback:header" /></slot></header>
    <main><slot><Text text="fallback:default" /></slot></main>
  </article>
}
export function ProtoReceiver() { return <section><slot name="__proto__" /></section> }
export function Composition(props: {show: boolean; ids: readonly string[]}) {
  return <Receiver>
    {props.show ? <Counter slot="header" text="conditional" /> : null}
    <Counter slot="header" text="fixed" />
    {props.ids.map(id => <Counter key={id} text={id} />)}
    <Counter text="tail" />
  </Receiver>
}
