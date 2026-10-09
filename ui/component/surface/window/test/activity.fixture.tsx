import {useEffect, useState} from "@zavx0z/immersive-component"
import Window from "@zavx0z/immersive-ui-component-surface-window"
import WindowControl from "@zavx0z/immersive-ui-component-surface-window-control"

/** Изолированная композиция слоя окон и dock, общая для headless-проверок. */
export default function Windows(props: {
  prefix: string
  ids: readonly string[]
  mounts: (id: string) => void
  disposes: (id: string) => void
}) {
  const [hidden, setHidden] = useState<readonly string[]>([])
  return <div style={css`
    position: relative;
    width: 640px;
    height: 480px;
  `}>
    <div data-placement="" style={css`
      position: absolute;
      width: 640px;
      height: 440px;
      z-index: 0;
      pointer-events: none;
    `}>
      {props.ids.map(id => (
        <Window
          key={id}
          id={`${props.prefix}-${id}`}
          title={id}
          open={!hidden.includes(id)}
          onOpenChange={open => setHidden(previous => open ? previous.filter(value => value !== id) : [...previous, id])}
          geometry={{x: id === "a" ? 20 : id === "b" ? 120 : 220, y: 20, width: 300, height: 300}}
          movable={true}
          resizable={true}
        >
          <Draft
            id={`${props.prefix}-${id}`}
            mounts={props.mounts}
            disposes={props.disposes}
          />
        </Window>
      ))}
    </div>
    <nav data-dock="" style={css`
      position: absolute;
      top: 444px;
      display: flex;
      height: 32px;
      z-index: 1;
    `}>
      {props.ids.map(id => (
        <WindowControl
          key={id}
          windowId={`${props.prefix}-${id}`}
          label={id}
          open={!hidden.includes(id)}
          onOpenChange={open => setHidden(previous => open ? previous.filter(value => value !== id) : [...previous, id])}
        />
      ))}
    </nav>
  </div>
}

/** Поле, локальное состояние и эффект обнаруживают случайное пересоздание окна. */
function Draft(props: {id: string; mounts: (id: string) => void; disposes: (id: string) => void}) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    props.mounts(props.id)
    return () => props.disposes(props.id)
  }, [])
  return <div>
    <input aria-label={props.id} defaultValue="Черновик" />
    <button onClick={() => setCount(count + 1)}>{count}</button>
    <div style={css`
      height: 600px;
      background: #334455;
    `}>Содержимое {props.id}</div>
  </div>
}
