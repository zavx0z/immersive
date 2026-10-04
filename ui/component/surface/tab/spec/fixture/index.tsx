import Tab from "@immersive-ui-component-surface/tab"
import type {ImmersiveUiComponentSurfaceTab} from "@immersive-ui-component-surface/tab"
type TabProps = ImmersiveUiComponentSurfaceTab.Input

/** Один и тот же Tab получает область от принимающей проекции или позиционированного контейнера. */
export function TabFixture(props: TabProps) {
  return <Tab
    label={props.label}
    position={props.position}
  >
    <slot />
  </Tab>
}
