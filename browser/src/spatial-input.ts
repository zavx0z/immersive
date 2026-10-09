import {MouseEvent, PointerEvent, type Document, type Element} from "@zavx0z/immersive-dom"
import {bindSpatialHit, type SpatialHit} from "@zavx0z/immersive-space"
import type {DocumentInteractionState} from "@zavx0z/immersive-renderer-html"

export type DocumentSpatialHit = Readonly<{target: Element; hit: SpatialHit}>

/** Spatial hits используют semantic события и capture того же Document. */
export function createSpatialInput(document: Document, state: DocumentInteractionState, onDetached: (pointerId: number) => void) {
  let hovered: DocumentSpatialHit | null = null
  let lastEvent: globalThis.PointerEvent | null = null
  const presses = new Map<number, {hit: DocumentSpatialHit; event: globalThis.PointerEvent}>()

  const unsubscribe = document.subscribeMutations(batch => {
    if (!batch.records.some(record => record.type === "childList")) return
    if (hovered !== null && !hovered.target.isConnected && lastEvent !== null) hover(null, lastEvent)
    for (const [id, press] of presses) if (!press.hit.target.isConnected) onDetached(id)
  })
  const ancestors = (target: Element | null): Element[] => {
    const result: Element[] = []
    for (let element = target; element !== null; element = element.parentElement) result.push(element)
    return result
  }

  const dispatch = (type: string, selected: DocumentSpatialHit, input: globalThis.PointerEvent, target = selected.target, bubbles = true, relatedTarget: Element | null = null) => {
    const event = new PointerEvent(type, {
      bubbles,
      cancelable: true,
      composed: true,
      clientX: input.clientX,
      clientY: input.clientY,
      pointerId: input.pointerId,
      pointerType: input.pointerType,
      isPrimary: input.isPrimary,
      button: input.button,
      buttons: input.buttons,
      pressure: input.pressure,
      ctrlKey: input.ctrlKey,
      shiftKey: input.shiftKey,
      altKey: input.altKey,
      metaKey: input.metaKey,
      relatedTarget,
    })
    bindSpatialHit(event, selected.hit)
    return target.dispatchEvent(event)
  }

  function hover(hit: DocumentSpatialHit | null, event: globalThis.PointerEvent): void {
    lastEvent = event
    if (hovered?.target === hit?.target) {
      hovered = hit
      return
    }
    const previous = hovered
    hovered = hit
    if (previous !== null) {
      dispatch("pointerout", previous, event, previous.target, true, hit?.target ?? null)
      const next = new Set(ancestors(hit?.target ?? null))
      for (const target of ancestors(previous.target)) if (!next.has(target)) dispatch("pointerleave", previous, event, target, false, hit?.target ?? null)
    }
    state.setHoveredElement(hit?.target ?? null)
    if (hit !== null) {
      dispatch("pointerover", hit, event, hit.target, true, previous?.target ?? null)
      const exited = new Set(ancestors(previous?.target ?? null))
      for (const target of ancestors(hit.target).reverse()) if (!exited.has(target)) dispatch("pointerenter", hit, event, target, false, previous?.target ?? null)
    }
  }

  return {
    move(hit: DocumentSpatialHit | null, event: globalThis.PointerEvent) {
      const press = presses.get(event.pointerId)
      if (press !== undefined) {
        press.event = event
        if (!press.hit.target.isConnected) return this.cancel(event.pointerId)
        const target = document.readPointerCaptureTarget(event.pointerId) ?? press.hit.target
        dispatch("pointermove", hit?.target === press.hit.target ? hit : press.hit, event, target)
        return
      }
      hover(hit, event)
      if (hit !== null) dispatch("pointermove", hit, event)
    },
    down(hit: DocumentSpatialHit, event: globalThis.PointerEvent) {
      document.beginPointer(event.pointerId)
      document.lightDismissPopovers(hit.target)
      document.closeSelectPickerOutside(hit.target)
      hover(hit, event)
      presses.set(event.pointerId, {hit, event})
      state.setActiveElement(hit.target)
      const accepted = dispatch("pointerdown", hit, event)
      document.readPointerCaptureTarget(event.pointerId)
      return accepted
    },
    up(hit: DocumentSpatialHit | null, event: globalThis.PointerEvent) {
      const press = presses.get(event.pointerId)
      if (press === undefined) return
      try {
        const target = document.readPointerCaptureTarget(event.pointerId) ?? press.hit.target
        const selected = hit?.target === press.hit.target ? hit : press.hit
        const accepted = target.isConnected && dispatch("pointerup", selected, event, target)
        if (accepted && event.button === 0 && hit?.target === press.hit.target && hit.hit.id === press.hit.hit.id) {
          const click = new MouseEvent("click", {
            bubbles: true, cancelable: true, composed: true,
            clientX: event.clientX, clientY: event.clientY,
            button: event.button, buttons: event.buttons,
            ctrlKey: event.ctrlKey, shiftKey: event.shiftKey,
            altKey: event.altKey, metaKey: event.metaKey,
          })
          bindSpatialHit(click, hit.hit)
          target.dispatchEvent(click)
        }
      } finally {
        presses.delete(event.pointerId)
        document.endPointer(event.pointerId)
        state.setActiveElement(null)
        hover(hit, event)
      }
    },
    cancel(pointerId: number) {
      const press = presses.get(pointerId)
      if (press === undefined) return
      try {
        const target = document.readPointerCaptureTarget(pointerId) ?? press.hit.target
        dispatch("pointercancel", press.hit, press.event, target)
      } finally {
        presses.delete(pointerId)
        document.endPointer(pointerId)
        state.setActiveElement(null)
        hover(null, press.event)
      }
    },
    leave(event: globalThis.PointerEvent) { hover(null, event) },
    refresh(hit: DocumentSpatialHit | null) {
      if (presses.size === 0 && lastEvent !== null) hover(hit, lastEvent)
    },
    dispose() {
      unsubscribe()
      for (const id of [...presses.keys()]) this.cancel(id)
      hovered = null
    },
  }
}
