import Window from "@zavx0z/immersive-ui-component-surface-window"
import TextField from "@zavx0z/immersive-ui-component-field-text"
import type {ImmersiveUiComponentSurfaceWindow as Contract} from "@zavx0z/immersive-ui-component-surface-window"

/** Авторская композиция двух перекрывающихся окон для нативного сценария. */
export default function WindowExample(props: Pick<Contract.Input, "open" | "message" | "layout" | "movable" | "resizable" | "onOpenChange"> & {overlap: boolean; glass: boolean}) {
  return <div style={css`
    position: relative;
    width: 100%;
    height: 100%;
  `}>
    {props.glass ? <GlassBackdrop /> : null}
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
        --space-node-navigation-background: ${props.glass ? "rgba(40, 55, 80, 0.3)" : "#884422"};
        border-radius: 6px;
        backdrop-filter: ${props.glass ? "blur(8px)" : "none"};
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
          --space-node-navigation-background: ${props.glass ? "rgba(40, 55, 80, 0.3)" : "#224488"};
          border-radius: 6px;
          backdrop-filter: ${props.glass ? "blur(8px)" : "none"};
        `}
      >
        <TextField value="Второй документ" />
      </Window>
    ) : null}
  </div>
}


/** Контрастный фон позволяет проверить размытие штатного CSS окна. */
function GlassBackdrop() {
  const stripes = Array.from({length: 40}, (_, index) => index)
  return <div style={css`
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
  `}>
    {stripes.map(index => (
      <Stripe
        key={index}
        index={index}
      />
    ))}
  </div>
}

function Stripe(props: {index: number}) {
  return <div style={css`
    position: absolute;
    left: ${props.index * 16}px;
    width: 16px;
    height: 100%;
    background: ${props.index % 2 === 0 ? "#bccade" : "#182536"};
  `} />
}
