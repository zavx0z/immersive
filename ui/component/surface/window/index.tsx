/**
Window — оболочка окна с шапкой и сохраняемым содержимым в HUD или Display.
Вторая часть окна — WindowControl: кнопка в статус-баре, Tab или другом месте
того же Document. Обе части получают общее open и onOpenChange.
Сворачивание скрывает всю оболочку, сохраняя DOM, состояние полей и прокрутку.

Шапка содержит кнопку сворачивания слева, единственный центрированный title
и действия справа. Перемещение и resize включаются явно и ограничиваются
принимающей областью. У каждого HUD и Display собственное активное окно и порядок.
Нажатие и focusin поднимают окно; потеря keyboard focus сохраняет активность.
Все окна одной проекции размещаются соседями в общем позиционированном родителе,
без внешних обёрток вокруг отдельных окон. Dock controls размещаются вне слоя окон.
Открытие восстанавливает прежний доступный фокус, сворачивание выбирает предыдущее
видимое окно своей проекции. Порядок задаётся CSS без перестановки component DOM.
Сообщение передаётся через message и отображается Notification слева внизу,
отдельно от прокручиваемого содержимого. onMessageDismiss включает крестик
и передаёт родителю закрытие сообщения без закрытия окна.
Window не создаёт Document, Canvas, Display или HUD и не хранит настройки приложения.

@packageDocumentation
*/
import {WindowMessage} from "./src/message.tsx"
import minusIcon from "@zavx0z/immersive-ui-theme-icon-minus"
import SurfaceButton from "@zavx0z/immersive-ui-component-surface-chrome-button"
import {WindowActionButton} from "./src/action.tsx"
import {WindowResizeHandles} from "./src/resize-handles.tsx"
import {useWindowGeometry} from "./src/use-geometry.ts"
import {useWindowActivity} from "./src/use-activity.ts"
import {validateWindow} from "./src/validate.ts"
import type {ImmersiveUiComponentSurfaceWindow as Contract} from "./contract"


export type {ImmersiveUiComponentSurfaceWindow} from "./contract"

export default function Window(props: Contract.Input): Contract.Output {
  validateWindow(props)
  const frame = useWindowGeometry(props)
  const activity = useWindowActivity(frame.areaElement, frame.element, props.open)
  const fill = props.layout === "fill"
  return <div
    ref={frame.areaElement}
    data-window-area=""
    data-layout={fill ? "fill" : "floating"}
    style={css`
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      pointer-events: none;
      --window-rank: ${activity.rank};
      z-index: var(--window-rank);

      &[data-layout="fill"] {
        position: relative;
        flex-grow: 1;
      }
    `}
  >
    <section
      ref={frame.element}
      id={props.id}
      role="dialog"
      aria-label={props.title}
      hidden={!props.open}
      data-window=""
      data-window-active={activity.active ? "true" : "false"}
      data-layout={fill ? "fill" : "floating"}
      onPointerDown={event => {
        const target = event.target as Element | null
        const control = ["button", "input", "textarea", "select", "a", "[tabindex]", "[contenteditable]"]
          .map(selector => target?.closest(selector))
          .find(node => node && node !== frame.element.current)
        if (!control || control === frame.element.current) frame.element.current?.focus()
      }}
      onPointerMove={event => frame.move(event)}
      onPointerUp={event => frame.move(event, "end")}
      onPointerCancel={event => { if (event.pointerId === frame.pointer()) frame.cancel() }}
      onLostPointerCapture={event => { if (event.pointerId === frame.pointer()) frame.cancel() }}
      style={css`
        --window-x: ${frame.box.x}px;
        --window-y: ${frame.box.y}px;
        --window-width: ${frame.box.width}px;
        --window-height: ${frame.box.height}px;

        position: absolute;
        left: 0;
        top: 0;
        transform: translate(var(--window-x), var(--window-y));
        width: var(--window-width);
        height: var(--window-height);
        max-width: 100%;
        max-height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        min-width: 0;
        min-height: 0;
        overflow: visible;
        pointer-events: auto;
        --window-outline: var(--widget-toolbar-outline);
        color: var(--widget-toolbar-content);

        &[data-window-active="true"] {
          --window-outline: var(--material-editor-outline-active);
        }

        &[data-layout="fill"] {
          left: 0;
          top: 0;
          transform: none;
          width: 100%;
          height: 100%;
        }

        &[hidden] {
          display: none;
        }

        ${props.style}
      `}
    >
      <div
        data-window-chrome=""
        style={css`
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          overflow: clip;
          border: var(--border-width-control) solid var(--window-outline);
          border-radius: 6px;
          background: var(--space-node-navigation-background);
        `}
      >
        <header
          data-window-header=""
          data-moving={frame.moving ? "true" : undefined}
          onPointerDown={event => {
            const target = event.target as Element | null
            const control = ["button", "input", "textarea", "select", "a[href]", '[role="button"]', '[contenteditable="true"]', '[contenteditable="plaintext-only"]', "[tabindex]"]
              .map(selector => target?.closest(selector))
              .find(node => node && node !== frame.element.current)
            if (!control) frame.start(event, "move")
          }}
          style={css`
            box-sizing: border-box;
            display: flex;
            align-items: center;
            height: 32px;
            flex-shrink: 0;
            padding: 3px 6px;
            gap: 4px;
            background: var(--space-node-header-background);
            user-select: none;
            touch-action: none;

            ${props.movable && !fill && css`
              cursor: grab;

              &[data-moving="true"] {
                cursor: grabbing;
              }
            `}
          `}
        >
          <div style={css`
            display: flex;
            width: 0;
            flex-grow: 1;
            min-width: 0;
          `}>
            <SurfaceButton
              label="Свернуть"
              ariaLabel={`Скрыть ${props.title}`}
              title="Свернуть"
              iconSrc={minusIcon}
              iconOnly={true}
              iconAction={true}
              expanded="true"
              controls={props.id}
              onClick={event => props.onOpenChange(false, event)}
            />
          </div>
          <span
            data-window-title=""
            style={css`
              display: block;
              width: 0;
              flex-grow: 2;
              min-width: 0;
              text-align: center;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              font-size: var(--font-size-sm);
            `}
          >{props.title}</span>
          <nav
            aria-label="Действия окна"
            style={css`
              display: flex;
              width: 0;
              flex-grow: 1;
              min-width: 0;
              justify-content: flex-end;
              gap: 4px;
            `}
          >
            {(props.actions ?? []).map(action => (
              <WindowActionButton
                key={action.key}
                action={action}
                onAction={props.onAction}
              />
            ))}
          </nav>
        </header>
        <div
          data-window-body=""
          style={css`
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            min-width: 0;
            min-height: 0;
            padding: 6px;
            overflow: auto;
          `}
        >
          <slot />
        </div>
        {props.message === undefined ? null : <WindowMessage
          value={props.message}
          onDismiss={props.onMessageDismiss}
        />}
      </div>
      {props.resizable && !fill ? (
        <WindowResizeHandles
          onStart={frame.start}
          onResize={frame.resizeBy}
        />
      ) : null}
    </section>
  </div>
}
