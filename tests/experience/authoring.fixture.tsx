import {useEffect, useState} from "@zavx0z/immersive-component/authoring"

type Lifecycle = {connected: number; disconnected: number}

type CounterProps = {
  label: string
  disabled?: boolean | undefined
  lifecycle: Lifecycle
  expose(update: (value: number) => void): void
}

export function Counter(props: CounterProps) {
  const [count, setCount] = useState(0)
  props.expose(setCount)
  useEffect(() => {
    props.lifecycle.connected++
    return () => { props.lifecycle.disconnected++ }
  }, [])
  return <button
    disabled={props.disabled === true}
    onClick={() => setCount(value => value + 1)}
    style={css`
      color: red;
      &:disabled {
        opacity: .5;
      }
    `}
  >
    {props.label}:{count}
  </button>
}

export function Receiver() {
  return <section>
    <header><slot name="header" /></header>
    <main><slot /></main>
  </section>
}

export function Authored(props: CounterProps) {
  return <Receiver>
    <Counter
      slot="header"
      label={props.label}
      disabled={props.disabled}
      lifecycle={props.lifecycle}
      expose={props.expose}
    />
  </Receiver>
}
