/** Статически известный child создаётся и обновляется напрямую, без construction record. */
export function emitStaticChild(prefix: string, start: string, end: string, type: string): string {
  return `(() => {
    let current = null, currentKey = null
    const ownsCurrent = () => {
      if (current === null || current.parentNode !== ${end}.parentNode) return false
      if (current.previousSibling === ${start} && current.nextSibling === ${end}) return true
      const parts = new Set(current instanceof ${prefix}DOMGroup ? current.insertionNodes : [current])
      for (let node = ${start}.nextSibling; node && node !== ${end}; node = node.nextSibling) parts.delete(node)
      return parts.size === 0
    }
    return {
      prepare(props, content, key, context) {
        if (key != null && typeof key !== "string" && typeof key !== "number") throw new TypeError("DOM component key must be a string or number")
        const previousOwned = ownsCurrent()
        if (previousOwned && Object.is(currentKey, key)) return current.prepareUpdate(props, content, context)
        const previousNodes = []
        for (let node = ${start}.nextSibling; node && node !== ${end}; node = node.nextSibling) previousNodes.push(node)
        const origins = ${prefix}CaptureOrigins(document, content)
        let next
        try { next = new ${type}(document, props, content, context) }
        catch (error) { origins.restore(); throw error }
        const previous = current
        let applied = false, accepted = false
        return {
          check() { return true },
          apply() {
            applied = true
            ${prefix}ReplaceRange(${start}, ${end}, [next])
          },
          rollback() {
            if (accepted) return
            if (applied) {
              next.remove()
              origins.restore()
              ${prefix}ReplaceRange(${start}, ${end}, previousNodes)
              origins.restoreFocus()
            }
            next.dispose()
            origins.restore()
          },
          commit() {
            current = next
            currentKey = key
            accepted = true
            if (previousOwned && previous.parentNode === null) previous.dispose()
          },
        }
      },
      dispose() {
        try { if (ownsCurrent()) current.dispose() }
        finally { current = null }
      },
    }
  })()`
}
