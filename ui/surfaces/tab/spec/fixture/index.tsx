import {Tab} from "@zavx0z/ui/surfaces/tab"
import type {TabProps} from "../../contract/input.ts"

/** Один и тот же Tab получает область от принимающей проекции или позиционированного контейнера. */
export function TabFixture(props: TabProps) {
  return <Tab
    label={props.label}
    position={props.position}
  >
    <slot />
  </Tab>
}
