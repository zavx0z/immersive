import {memo, useEffect, useState} from "@zavx0z/component"

export function Counter(props: {id: string; label: string; onDispose(id: string): void}) {
  const [count, setCount] = useState(0)
  useEffect(() => () => props.onDispose(props.id), [])
  return (
    <button
      data-counter={props.id}
      onClick={() => setCount(value => value + 1)}
    >
      {props.label}:{count}
    </button>
  )
}

function Fallback() {
  return <span data-fallback="true">Пусто</span>
}

export function Panel({title}: {title: string}) {
  return (
    <section title={title}>
      <header>
        <slot name="header" />
      </header>
      <main>
        <slot />
      </main>
      <footer>
        <slot name="footer">
          <Fallback />
        </slot>
      </footer>
    </section>
  )
}

function Forward({title}: {title: string}) {
  return (
    <Panel title={title}>
      <slot
        name="header"
        slot="header"
      />
      <slot />
      <slot
        name="footer"
        slot="footer"
      />
    </Panel>
  )
}

export function SlotsDemo(props: {
  title: string
  rows: readonly {id: string; label: string}[]
  showFooter: boolean
  onDispose(id: string): void
}) {
  return (
    <Forward title={props.title}>
      <Counter
        slot="header"
        id="header"
        label={props.title}
        onDispose={props.onDispose}
      />
      {props.rows.map(row => (
        <Counter
          key={row.id}
          id={row.id}
          label={row.label}
          onDispose={props.onDispose}
        />
      ))}
      {props.showFooter ? (
        <Counter
          slot="footer"
          id="footer"
          label="Действие"
          onDispose={props.onDispose}
        />
      ) : null}
    </Forward>
  )
}

export function TextSlot() {
  return (
    <section>
      <slot>Резерв</slot>
    </section>
  )
}

export function ZeroSlot() {
  return <TextSlot>{0}</TextSlot>
}

export function EmptyPanel() {
  return (
    <article>
      <slot />
    </article>
  )
}

const MemoPanel = memo(EmptyPanel)

export function MemoSlots(props: {text: string}) {
  return <MemoPanel>{props.text}</MemoPanel>
}

export function EvaluationOrder(props: {record(name: string): string; onDispose(id: string): void}) {
  return (
    <Panel title="Порядок">
      <Counter
        slot="footer"
        id="ordered-footer"
        label={props.record("footer")}
        onDispose={props.onDispose}
      />
      <Counter
        slot="header"
        id="ordered-header"
        label={props.record("header")}
        onDispose={props.onDispose}
      />
    </Panel>
  )
}
