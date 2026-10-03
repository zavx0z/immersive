/**
Пристыкованный Tab перемещается по периметру своей области и меняет сторону у углов.
Подложка использует --widget-toolbar-background главной темы без подсветки
при наведении. Со стороны примыкания рамка отсутствует. Родитель задаёт область обычным CSS. Один и тот же компонент используется в HUD,
Display и вложенных контейнерах; окон, камер и отдельного рендера он не создаёт.

@packageDocumentation
*/
import {useLayoutEffect} from "@zavx0z/component"
import {useRef} from "@zavx0z/component"
import {useState} from "@zavx0z/component"
import {observeElementLayout} from "@zavx0z/dom/geometry"
import {readElementLayoutRect} from "@zavx0z/dom/geometry"
import {hasSlot} from "@zavx0z/component/slot-presence"
import type {UiSurfacesTab as Contract} from "./contract"
import {dockTab} from "./src/placement.ts"
import {readTabPosition} from "./src/placement.ts"
import {tabRect} from "./src/placement.ts"
import type {TabArea} from "./src/placement.ts"
import type {TabPosition} from "./src/placement.ts"

export type {UiSurfacesTab} from "./contract"


export default function Tab(props: Contract.Input): Contract.Output {
  const supplied = hasSlot()
  if (!supplied && !props.label?.trim()) throw new TypeError("Tab requires label or slot content")
  const caption = supplied ? "" : props.label
  if (![props.length, props.thickness].every(value => value === undefined || Number.isFinite(value) && value > 0)) {
    throw new RangeError("Tab dimensions must be positive finite CSS pixels")
  }
  const areaElement = useRef<HTMLDivElement | null>(null)
  const handle = useRef<HTMLDivElement | null>(null)
  const [area, setArea] = useState<TabArea>({width: 0, height: 0})
  const [size, setSize] = useState<TabArea>({width: 0, height: 0})
  const declaredPosition = readTabPosition(props.position)
  const [position, setPosition] = useState(() => declaredPosition)
  const positionRef = useRef(position)
  const drag = useRef<{
    pointer: number
    started: boolean
    captureOwner: Element
    x: number
    y: number
    centerX: number
    centerY: number
    initial: TabPosition
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const vertical = position.edge === "left" || position.edge === "right"
  const sizing = {size, length: props.length, thickness: props.thickness}
  const authoredWidth = vertical ? props.thickness : props.length
  const authoredHeight = vertical ? props.length : props.thickness
  const rect = tabRect(position, area, sizing)
  /** Обновляет внутреннее положение до следующего pointer event, не дожидаясь render. */
  const publish = (next: TabPosition, phase: "change" | "end" | "cancel") => {
    positionRef.current = next
    setPosition(next)
    props.onPositionChange?.(next, phase)
  }
  /** Отзывает capture после очистки жеста, чтобы lostpointercapture не отменил успешный drop. */
  const release = () => {
    const active = drag.current
    drag.current = null
    setDragging(false)
    if (active?.captureOwner.hasPointerCapture(active.pointer)) active.captureOwner.releasePointerCapture(active.pointer)
  }
  useLayoutEffect(() => {
    release()
    positionRef.current = declaredPosition
    setPosition(previous => previous.edge === declaredPosition.edge && previous.offset === declaredPosition.offset
      ? previous : declaredPosition)
  }, [declaredPosition.edge, declaredPosition.offset])
  /** Возвращает таб в исходное положение при cancel, потере capture или отключении компонента. */
  const cancel = () => {
    const active = drag.current
    if (!active) return
    release()
    if (active.started) publish(active.initial, "cancel")
  }
  useLayoutEffect(() => {
    const element = areaElement.current
    if (!element) return
    /** Читает готовую область при mount; Browser доставит её позже, если provider ещё не подключён. */
    const measure = (bounds: DOMRectReadOnly | null) => {
      const next = {width: bounds?.width ?? 0, height: bounds?.height ?? 0}
      setArea(previous => previous.width === next.width && previous.height === next.height ? previous : next)
    }
    measure(readElementLayoutRect(element))
    return observeElementLayout(element, measure)
  }, [])
  useLayoutEffect(() => {
    const element = handle.current
    if (!element) return
    const measure = (bounds: DOMRectReadOnly | null) => {
      if (!bounds) return
      const next = {width: bounds.width, height: bounds.height}
      setSize(previous => previous.width === next.width && previous.height === next.height ? previous : next)
    }
    measure(readElementLayoutRect(element))
    return observeElementLayout(element, measure)
  }, [])
  useLayoutEffect(() => { if (props.disabled) cancel() }, [props.disabled])
  useLayoutEffect(() => () => {
    const active = drag.current
    drag.current = null
    if (active?.captureOwner.hasPointerCapture(active.pointer)) active.captureOwner.releasePointerCapture(active.pointer)
  }, [])
  /** Начинает один основной pointer-жест в локальных координатах проекции. */
  const start = (event: PointerEvent) => {
    const element = areaElement.current
    const button = handle.current
    if (props.disabled || event.button !== 0 || drag.current || !element || !button) return
    const target = event.target as Element | null
    const findControl = (selectors: readonly string[]) => selectors
      .map(selector => target?.closest?.(selector))
      .find(control => control != null && control !== button && button.contains(control))
    if (findControl(["input", "select", "textarea", '[contenteditable="true"]', '[contenteditable="plaintext-only"]'])) return
    const interactive = findControl(["button", "a[href]", '[role="button"]'])
    const bounds = readElementLayoutRect(element)
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return
    const startRect = tabRect(positionRef.current, bounds, sizing)
    drag.current = {pointer: event.pointerId, started: !interactive, captureOwner: interactive ?? button, x: event.clientX, y: event.clientY,
      centerX: startRect.x + startRect.width / 2, centerY: startRect.y + startRect.height / 2,
      initial: positionRef.current}
    drag.current.captureOwner.setPointerCapture(event.pointerId)
    if (interactive) return
    setDragging(true)
    event.preventDefault()
    event.stopPropagation()
  }
  /** Переставляет таб на ближайший край и учитывает конечную точку pointerup. */
  const move = (event: PointerEvent, phase: "change" | "end" = "change") => {
    const active = drag.current
    const element = areaElement.current
    if (!active || active.pointer !== event.pointerId || !element) return
    if (!active.started) {
      if (Math.hypot(event.clientX - active.x, event.clientY - active.y) < 4) {
        if (phase === "end") release()
        return
      }
      active.started = true
      if (handle.current) active.captureOwner = handle.current
      active.captureOwner.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    const bounds = readElementLayoutRect(element)
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return cancel()
    const next = dockTab({x: active.centerX + event.clientX - active.x, y: active.centerY + event.clientY - active.y},
      bounds, positionRef.current.edge, sizing)
    if (phase === "end") release()
    publish(next, phase)
    event.preventDefault()
    event.stopPropagation()
  }
  return <div
    ref={areaElement}
    data-tab-area=""
    style={css`
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    `}
  >
    <div
      ref={handle}
      role="group"
      tabIndex={props.disabled ? -1 : 0}
      aria-label={props.label}
      title={props.label}
      aria-disabled={props.disabled === true}
      data-tab=""
      data-edge={position.edge}
      data-dragging={dragging ? "true" : undefined}
      data-ready={area.width > 0 && area.height > 0 ? "true" : undefined}
      onPointerDown={start}
      onPointerMove={event => move(event)}
      onPointerUp={event => move(event, "end")}
      onPointerCancel={event => { if (event.pointerId === drag.current?.pointer) cancel() }}
      onLostPointerCapture={event => { if (event.pointerId === drag.current?.pointer && event.target === drag.current.captureOwner) cancel() }}
      style={css`
        --tab-x: ${rect.x}px;
        --tab-y: ${rect.y}px;
        --tab-width: ${authoredWidth === undefined ? "max-content" : `${authoredWidth}px`};
        --tab-height: ${authoredHeight === undefined ? "max-content" : `${authoredHeight}px`};
        --tab-padding-inline: ${supplied ? 0 : 6}px;

        position: absolute;
        left: var(--tab-x);
        top: var(--tab-y);
        width: var(--tab-width);
        height: var(--tab-height);
        max-width: 100%;
        max-height: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding-inline-start: var(--tab-padding-inline);
        padding-inline-end: var(--tab-padding-inline);
        padding-block-start: 0;
        padding-block-end: 0;
        overflow: hidden;
        visibility: hidden;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        cursor: grab;
        border: 1px solid var(--widget-regular-outline);
        background: var(--widget-toolbar-background);
        color: var(--widget-regular-content);
        font-size: var(--font-size-xs);
        writing-mode: horizontal-tb;
        text-orientation: sideways;

        &[data-ready="true"] {
          visibility: visible;
        }

        &[data-edge="left"] {
          border-left-width: 0;
          border-radius: 0 4px 4px 0;
          writing-mode: sideways-rl;
        }

        &[data-edge="right"] {
          border-right-width: 0;
          border-radius: 4px 0 0 4px;
          writing-mode: sideways-lr;
        }

        &[data-edge="top"] {
          border-top-width: 0;
          border-radius: 0 0 4px 4px;
        }

        &[data-edge="bottom"] {
          border-bottom-width: 0;
          border-radius: 4px 4px 0 0;
        }

        &[data-dragging="true"] {
          cursor: grabbing;
        }

        &[aria-disabled="true"] {
          cursor: default;
        }

        ${props.style}
      `}
    >
      <span
        hidden={supplied}
        style={css`
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          pointer-events: none;
          &[hidden] {
            display: none;
          }
        `}
      >
        {caption}
      </span>
      <slot />
    </div>
  </div>
}
