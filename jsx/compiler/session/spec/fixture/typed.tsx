import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

interface PanelSlots { default?: typeof Caption }

function Caption(props: {text: string}) {
  return <span>{props.text}</span>
}

export function Panel(): JSX.Element<PanelSlots> {
  return <section>
    <slot />
  </section>
}

export function Example() {
  return <Panel>
    <Caption text="Вложенное содержимое" />
  </Panel>
}
