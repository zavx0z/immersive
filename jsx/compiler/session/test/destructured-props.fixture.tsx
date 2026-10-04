import {useEffect, useState} from "@zavx0z/immersive-component"

type SlotProps = Readonly<{
  style?: CssStyle | undefined
}>

function Slot({style}: SlotProps) {
  return (
    <section
      data-slot=""
      style={css`
        color: blue;

        ${style}
      `}
    >
      <slot />
    </section>
  )
}

function ForwardingSlot({style: appearance}: SlotProps) {
  return (
    <Slot style={appearance}>
      <slot />
    </Slot>
  )
}

function SingleSlot() {
  return (
    <article>
      <slot />
    </article>
  )
}

function OptionalSlot() {
  return (
    <aside>
      <slot />
    </aside>
  )
}

function PrimitiveSlot() {
  return (
    <p>
      <slot>default</slot>
    </p>
  )
}

function Caption({value}: Readonly<{value: string}>) {
  return <span>{value}</span>
}

function Counter({id, label, onDispose}: Readonly<{
  id: string
  label: string
  onDispose(id: string): void
}>) {
  const [count, setCount] = useState(0)
  useEffect(() => () => onDispose(id), [])
  return (
    <button
      data-counter={id}
      onClick={() => setCount(value => value + 1)}
    >
      {label}:{count}
    </button>
  )
}

export function DestructuredPropsDemo(props: Readonly<{
  rows: readonly Readonly<{id: string; label: string}>[]
  caption: string
  padding: number
  show: boolean
  onDispose(id: string): void
}>) {
  return (
    <main>
      <ForwardingSlot
        style={css`
          padding: ${props.padding}px;
          color: red;
        `}
      >
        {props.rows.map(row => (
          <Counter
            key={row.id}
            id={row.id}
            label={row.label}
            onDispose={props.onDispose}
          />
        ))}
      </ForwardingSlot>
      <Slot />
      <SingleSlot>
        <Caption value={props.caption} />
      </SingleSlot>
      <OptionalSlot>
        {props.show ? (
          <Counter
            id="optional"
            label="Optional"
            onDispose={props.onDispose}
          />
        ) : null}
      </OptionalSlot>
      <PrimitiveSlot />
      <PrimitiveSlot>{props.caption}</PrimitiveSlot>
    </main>
  )
}
