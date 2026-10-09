import Window from "@zavx0z/immersive-ui-component-surface-window"
import TextField from "@zavx0z/immersive-ui-component-field-text"
import type {ImmersiveUiComponentSurfaceWindow as Contract} from "@zavx0z/immersive-ui-component-surface-window"

/** Авторская композиция двух перекрывающихся окон для нативного сценария. */
export default function WindowExample(props: Pick<Contract.Input, "open" | "message" | "layout" | "movable" | "resizable" | "onOpenChange"> & {overlap: boolean}) {
  return <div style={css`
    position: relative;
    width: 100%;
    height: 100%;
  `}>
    <Window
      id="example-window"
      title="Документ"
      open={props.open}
      message={props.message}
      layout={props.layout}
      movable={props.movable}
      resizable={props.resizable}
      onOpenChange={props.onOpenChange}
      style={css`
        --space-node-navigation-background: #884422;
      `}
    >
      <TextField value="Сохраняемое содержимое" />
    </Window>
    {props.overlap ? (
      <Window
        id="second-window"
        title="Второе окно"
        open={true}
        onOpenChange={() => {}}
        geometry={{x: 160, y: 100, width: 320, height: 240}}
        style={css`
          --space-node-navigation-background: #224488;
        `}
      >
        <TextField value="Второй документ" />
      </Window>
    ) : null}
  </div>
}
