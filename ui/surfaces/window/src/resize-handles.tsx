import type {WindowGesture} from "./geometry.ts"

/** Восемь зон изменения размера принадлежат той же оболочке и общему pointer-жесту. */
export function WindowResizeHandles(props: Readonly<{onStart: (event: PointerEvent, edge: WindowGesture) => void; onResize: (edge: WindowGesture, dx: number, dy: number) => void}>) {
  return <>
    {(["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const).map(edge => (
      <WindowResizeHandle
        key={edge}
        edge={edge}
        onStart={props.onStart}
        onResize={props.onResize}
      />
    ))}
  </>
}

/** Одна зона resize, расположенная CSS у края оболочки. */
function WindowResizeHandle(props: Readonly<{edge: WindowGesture; onStart: (event: PointerEvent, edge: WindowGesture) => void; onResize: (edge: WindowGesture, dx: number, dy: number) => void}>) {
  return <button
    type="button"
    aria-label={`Изменить размер окна: ${resizeNames[props.edge]}`}
    data-window-resize={props.edge}
    data-axis={props.edge.length === 2 ? "corner" : props.edge === "n" || props.edge === "s" ? "vertical" : "horizontal"}
    data-top={props.edge.includes("n") ? "true" : undefined}
    data-bottom={props.edge.includes("s") ? "true" : undefined}
    data-left={props.edge.includes("w") ? "true" : undefined}
    data-right={props.edge.includes("e") ? "true" : undefined}
    data-diagonal={props.edge.length !== 2 ? undefined : props.edge === "nw" || props.edge === "se" ? "nwse" : "nesw"}
    onPointerDown={event => props.onStart(event, props.edge)}
    onKeyDown={event => {
      const step = event.shiftKey ? 10 : 1
      const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
      const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0
      if (dx === 0 && dy === 0) return
      event.preventDefault()
      props.onResize(props.edge, dx, dy)
    }}
    style={css`
      position: absolute;
      touch-action: none;
      padding: 0;
      margin: 0;
      border: 0;
      background: transparent;
      pointer-events: auto;
      z-index: 1;

      &[data-axis="vertical"] {
        left: 10px;
        right: 10px;
        height: 6px;
        cursor: ns-resize;
      }

      &[data-axis="horizontal"] {
        top: 10px;
        bottom: 10px;
        width: 6px;
        cursor: ew-resize;
      }

      &[data-axis="corner"] {
        width: 10px;
        height: 10px;
      }

      &[data-top="true"] {
        top: 0;
      }

      &[data-bottom="true"] {
        bottom: 0;
      }

      &[data-left="true"] {
        left: 0;
      }

      &[data-right="true"] {
        right: 0;
      }

      &[data-diagonal="nwse"] {
        cursor: nwse-resize;
      }

      &[data-diagonal="nesw"] {
        cursor: nesw-resize;
      }
    `}
  />
}

/** Доступные имена сторон и углов; move не создаёт resize-кнопку. */
const resizeNames: Record<WindowGesture, string> = {
  move: "положение",
  n: "верхняя сторона",
  s: "нижняя сторона",
  e: "правая сторона",
  w: "левая сторона",
  ne: "верхний правый угол",
  nw: "верхний левый угол",
  se: "нижний правый угол",
  sw: "нижний левый угол",
}
