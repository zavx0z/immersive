import type {JSX} from "@jsx/types"

function Action(props: {id: string}) {
  return <button data-action={props.id}>{props.id}</button>
}

function Heading() {
  return <strong>Действия</strong>
}

interface PanelSlots {
  heading: typeof Heading
  default?: readonly typeof Action[]
  footer?: typeof Action
}

function Panel(): JSX.Element<PanelSlots> {
  return <section>
    <header>
      <slot name="heading" />
    </header>
    <main>
      <slot />
    </main>
    <footer>
      <slot name="footer" />
    </footer>
  </section>
}

function Forward(): JSX.Element<PanelSlots> {
  return <Panel>
    <slot name="heading" slot="heading" />
    <slot />
    <slot name="footer" slot="footer" />
  </Panel>
}

export function TypedComposition(props: {rows: readonly string[], show: boolean}) {
  return <Forward>
    <Heading slot="heading" />
    {props.rows.map(id => <Action key={id} id={id} />)}
    {props.show ? <Action slot="footer" id="footer" /> : null}
  </Forward>
}
