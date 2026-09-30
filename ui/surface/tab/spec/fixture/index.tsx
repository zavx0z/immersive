import Tab from "@ui-surfaces/tab"
import type {TabProps} from "@ui-surfaces/tab"

/** Один и тот же Tab получает область от принимающей проекции или позиционированного контейнера. */
export function TabFixture(props: TabProps) {
  return <Tab
    label={props.label}
    position={props.position}
  >
    <slot />
  </Tab>
}
