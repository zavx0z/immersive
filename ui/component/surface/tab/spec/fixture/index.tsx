import Tab from "@zavx0z/immersive-ui-component-surface-tab"
import type {ImmersiveUiComponentSurfaceTab} from "@zavx0z/immersive-ui-component-surface-tab"
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
