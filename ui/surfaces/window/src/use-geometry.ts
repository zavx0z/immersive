import {useLayoutEffect, useRef, useState} from "@zavx0z/component"
import {observeElementLayout, readElementLayoutRect} from "@zavx0z/dom/geometry"
import type {WindowProps} from "../contract/input.ts"
import type {WindowGeometry} from "../types.ts"
import {dragWindow, fitWindow, type WindowGesture} from "./geometry.ts"

/** Владеет одним pointer capture; отмена и скрытие возвращают геометрию начала жеста. */
export function useWindowGeometry(props: WindowProps) {
  const areaElement = useRef<HTMLDivElement | null>(null)
  const element = useRef<HTMLElement | null>(null)
  const declared = props.geometry ?? {x: 24, y: 24, width: 320, height: 240}
  const [geometry, setGeometry] = useState(declared)
  const current = useRef(geometry)
  const [moving, setMoving] = useState(false)
  const [area, setArea] = useState({width: 0, height: 0})
  const gesture = useRef<{pointer: number; x: number; y: number; box: WindowGeometry; kind: WindowGesture} | null>(null)
  const minWidth = props.minWidth ?? 240
  const minHeight = props.minHeight ?? 160
  const box = fitWindow(geometry, area, minWidth, minHeight)
  current.current = box
  const publish = (next: WindowGeometry, phase: "change" | "end" | "cancel") => {
    current.current = next
    setGeometry(next)
    props.onGeometryChange?.(next, phase)
  }
  const release = (updateState = true) => {
    const active = gesture.current
    gesture.current = null
    if (updateState) setMoving(false)
    if (active && element.current?.hasPointerCapture(active.pointer)) element.current.releasePointerCapture(active.pointer)
  }
  const cancel = () => {
    const active = gesture.current
    if (!active) return
    release()
    publish(active.box, "cancel")
  }
  useLayoutEffect(() => {
    const node = areaElement.current
    if (!node) return
    const measure = (rect: DOMRectReadOnly | null) => {
      const next = {width: rect?.width ?? 0, height: rect?.height ?? 0}
      setArea(previous => previous.width === next.width && previous.height === next.height ? previous : next)
    }
    measure(readElementLayoutRect(node))
    return observeElementLayout(node, measure)
  }, [])
  useLayoutEffect(() => {
    const previous = current.current
    if (previous.x === declared.x && previous.y === declared.y && previous.width === declared.width && previous.height === declared.height) return
    release()
    current.current = declared
    setGeometry(declared)
  }, [declared.x, declared.y, declared.width, declared.height])
  useLayoutEffect(() => {
    if (!props.open || props.layout === "fill" || (gesture.current?.kind === "move" ? !props.movable : !props.resizable)) cancel()
  }, [props.open, props.layout, props.movable, props.resizable])
  useLayoutEffect(() => () => release(false), [])
  const start = (event: PointerEvent, kind: WindowGesture) => {
    if (event.button !== 0 || gesture.current || !element.current || !props.open || props.layout === "fill") return
    if (kind === "move" ? !props.movable : !props.resizable) return
    if (area.width <= 0 || area.height <= 0) return
    gesture.current = {pointer: event.pointerId, x: event.clientX, y: event.clientY, box: current.current, kind}
    setMoving(kind === "move")
    element.current.focus()
    element.current.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }
  const move = (event: PointerEvent, phase: "change" | "end" = "change") => {
    const active = gesture.current
    if (!active || active.pointer !== event.pointerId) return
    const next = dragWindow(active.box, active.kind, event.clientX - active.x, event.clientY - active.y, area, minWidth, minHeight)
    if (phase === "end") release()
    publish(next, phase)
    event.preventDefault()
    event.stopPropagation()
  }
  const resizeBy = (kind: WindowGesture, dx: number, dy: number) => {
    if (!props.open || !props.resizable || props.layout === "fill") return
    publish(dragWindow(current.current, kind, dx, dy, area, minWidth, minHeight), "end")
  }
  return {areaElement, element, box, moving, start, move, cancel, resizeBy, pointer: () => gesture.current?.pointer}
}
