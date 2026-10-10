/** Локальный план конкретного JSX-диапазона; DOM получает только реальные узлы. */
export function emitRange(prefix: string, start: string, end: string): string {
  return `(() => {
    let entries = []
    let fragments = new WeakMap()
    const parent = () => ${end}.parentNode
    const between = () => { const nodes = []; for (let node = ${start}.nextSibling; node && node !== ${end}; node = node.nextSibling) nodes.push(node); return nodes }
    return {
      prepare(content, context) {
        const inputOrigins = ${prefix}CaptureOrigins(document, content)
        const nextFragments = new WeakMap()
        const values = []
        const seenArrays = new Set()
        const flatten = (value, path) => {
          if (value == null || typeof value === "boolean" || value === "") return
          if (Array.isArray(value)) {
            if (seenArrays.has(value)) throw new TypeError("DOM content arrays cannot contain themselves")
            seenArrays.add(value)
            value.forEach((child, index) => flatten(child, path + "/" + index))
            seenArrays.delete(value)
          } else if (value instanceof ${prefix}DocumentFragment) {
            const nodes = value.childNodes.length ? [...value.childNodes] : fragments.get(value) ?? []
            nextFragments.set(value, nodes)
            nodes.forEach(node => values.push({value: node, key: node}))
          } else values.push({value, key: value?.key ?? (value instanceof ${prefix}Node || value instanceof ${prefix}DOMGroup ? value : path)})
        }
        flatten(content, "")
        const keys = new Set(), next = [], staged = [], plans = []
        const previousByKey = new Map(entries.map(entry => [entry.key, entry]))
        const previousNodes = between()
        const owned = new Set(previousNodes)
        const owns = node => (node instanceof ${prefix}DOMGroup ? node.insertionNodes : [node]).every(part => owned.has(part))
        let applied = false, accepted = false, appliedChildren = 0
        try {
          for (const item of values) {
            if (keys.has(item.key)) throw new Error("Duplicate keyed component: " + String(item.key))
            keys.add(item.key)
            const value = item.value
            const construction = value !== null && typeof value === "object" && typeof value.type === "function"
            if (construction && value.key != null && typeof value.key !== "string" && typeof value.key !== "number") throw new TypeError("DOM component key must be a string or number")
            const type = construction ? value.type : value instanceof ${prefix}Node || value instanceof ${prefix}DOMGroup ? null : "text"
            const candidate = previousByKey.get(item.key)
            const previous = candidate?.type === type && owns(candidate.node) ? candidate : null
            let node, plan = null, created = false
            if (construction) {
              const props = value.props
              const content = value.content ?? props?.[${prefix}SlotsKey]
              if (previous) { node = previous.node; plan = node.prepareUpdate(props, content, ${prefix}MergeContext(context, value.context)) }
              else { node = new value.type(document, props, content, ${prefix}MergeContext(context, value.context)); created = true; staged.push(node) }
            } else if (type === null) node = value
            else {
              const text = ${prefix}Text(value)
              node = previous?.node ?? document.createTextNode("")
              plan = ${prefix}PrepareText(node, text)
            }
            next.push({node, key: item.key, type, created: construction})
            if (plan) plans.push(plan)
          }
          ${prefix}ValidateNodes(document, next.flatMap(entry => entry.node instanceof ${prefix}DOMGroup ? entry.node.insertionNodes : [entry.node]), ${end})
        } catch (error) { try { for (const node of staged) node.dispose() } finally { inputOrigins.restore() }; throw error }
        const origins = ${prefix}CaptureOrigins(document, next.map(entry => entry.node))
        return {
          check() { return plans.every(plan => !plan.check || plan.check()) },
          apply() {
            applied = true
            for (const plan of plans) { appliedChildren++; plan.apply() }
            ${prefix}ReplaceRange(${start}, ${end}, next.map(entry => entry.node))
          },
          rollback() {
            if (accepted) return
            if (applied) {
              for (let index = appliedChildren - 1; index >= 0; index--) plans[index].rollback?.()
              origins.restore()
              inputOrigins.restore()
              ${prefix}ReplaceRange(${start}, ${end}, previousNodes)
              inputOrigins.restoreFocus()
            }
            for (const node of staged) node.dispose()
            inputOrigins.restore()
          },
          commit() {
            const previousEntries = entries
            entries = next
            fragments = nextFragments
            accepted = true
            let failed = false, failure
            for (const plan of plans) try { plan.commit?.() } catch (error) { if (!failed) { failed = true; failure = error } }
            const retained = new Set(next.map(entry => entry.node))
            for (const entry of previousEntries) if (entry.created && !retained.has(entry.node) && owns(entry.node) && entry.node.parentNode === null) {
              try { entry.node.dispose() } catch (error) { if (!failed) { failed = true; failure = error } }
            }
            if (failed) throw failure
          },
          refs() { for (const plan of plans) plan.refs?.() },
          insertion() { for (const plan of plans) plan.insertion?.() },
          layout() { for (const plan of plans) plan.layout?.() },
          passive() { for (const plan of plans) plan.passive?.() },
        }
      },
      dispose() {
        const owned = new Set(between())
        let failed = false, failure
        for (const entry of entries) {
          try { if (entry.created && (entry.node instanceof ${prefix}DOMGroup ? entry.node.insertionNodes : [entry.node]).every(node => owned.has(node))) entry.node.dispose() } catch (error) { if (!failed) { failed = true; failure = error } }
          try {
            if (entry.node instanceof ${prefix}DOMGroup) { if (entry.node.insertionNodes.every(node => owned.has(node))) entry.node.remove() }
            else if (owned.has(entry.node)) entry.node.remove()
          } catch (error) { if (!failed) { failed = true; failure = error } }
        }
        entries = []
        if (failed) throw failure
      },
    }
  })()`
}
