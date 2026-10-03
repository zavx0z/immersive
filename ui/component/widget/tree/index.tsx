/**
Дерево с выбором, навигацией и ограниченным окном материализованных строк.
Реализация и её контракт принадлежат этому пакету; потребители используют его публичный вход.

@packageDocumentation
*/
import type {TreeContext} from "./src/types"
import type {TreeItem} from "./contract/types.ts"
import {TreePlainRows} from "./src/helpers.tsx"
import type {UiWidgetsTree as Contract} from "./contract"
import type {TreeRow} from "./src/types"
import {TreeWindowedRows} from "./src/helpers.tsx"
import {isTreeDescendant} from "./src/helpers.tsx"
import {useLayoutEffect} from "@zavx0z/component"
import {useRef} from "@zavx0z/component"
import {useState} from "@zavx0z/component"
import {readElementLayoutRect} from "@zavx0z/dom/geometry"
import WidgetHeader from "@ui-widgets/header"
import {materializedTreeRows} from "./src/windowing.ts"
import {retainedTreeBlocks} from "./src/windowing.ts"
import {treeScrollWindowStart} from "./src/windowing.ts"
import {visibleTreeRows} from "./src/windowing.ts"
import {windowedTreeBlocks} from "./src/windowing.ts"
import type {WindowedTreeBlock} from "./src/windowing.ts"


export type {UiWidgetsTree} from "./contract"

export default function Tree(props: Contract.Input): Contract.Output {
  const refs = useRef(new Map<string, HTMLLIElement>())
  const anchor = useRef<string | null>(null)
  const viewport = useRef<HTMLUListElement | null>(null)
  const pendingFocus = useRef<string | null>(null)
  const pendingReveal = useRef<string | null>(null)
  const createdIds = useRef(new Set<string>())
  const previousResetKey = useRef(props.windowing?.resetKey)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [windowStart, setWindowStart] = useState(0)
  const expanded = new Set(props.expandedKeys)
  const selected = new Set(props.selectedKeys)
  const rows: TreeRow[] = []
  const ids = new Set<string>()
  const visit = (items: readonly TreeItem[], parent: string | null, visible: boolean) => {
    for (const item of items) {
      if (item.id === "" || ids.has(item.id)) throw new Error(`Tree item id must be non-empty and unique: ${item.id}`)
      ids.add(item.id)
      if (visible) rows.push({item, parent})
      visit(item.children ?? [], item.id, visible && expanded.has(item.id))
    }
  }
  visit(props.items, null, true)
  const focusKey = (props.selectionFollowsFocus === false && rows.some(row => row.item.id === focusedId && !row.item.disabled) ? focusedId : null)
    ?? props.selectedKeys.find(key => rows.some(row => row.item.id === key && !row.item.disabled))
    ?? rows.find(row => !row.item.disabled)?.item.id ?? null
  const windowRows = props.windowing === undefined ? [] : visibleTreeRows(props.items, expanded)
  const maximumStart = Math.max(0, windowRows.length - (props.windowing?.size ?? 0))
  const boundedStart = Math.min(maximumStart, Math.max(0, windowStart))
  const visibleBlocks = props.windowing === undefined ? [] : windowedTreeBlocks(
    props.items, windowRows, expanded, boundedStart, props.windowing.size, focusKey,
  )
  const rememberBlocks = (blocks: readonly WindowedTreeBlock<TreeItem>[]): void => {
    for (const block of blocks) {
      if (block.kind === "item") {
        createdIds.current.add(block.item.id)
        rememberBlocks(block.children)
      }
    }
  }
  rememberBlocks(visibleBlocks)
  const blocks = props.windowing === undefined ? undefined : retainedTreeBlocks(
    visibleBlocks, props.windowing.retainedItems ?? props.items, createdIds.current,
  )
  const ensureWindow = (id: string): boolean => {
    if (props.windowing === undefined) return false
    const index = windowRows.findIndex(row => row.item.id === id)
    if (index < 0) return false
    const viewportRows = props.windowing.viewRows ?? 20
    const firstVisible = Math.floor((viewport.current?.scrollTop ?? 0) / props.windowing.rowHeight)
    const outsideViewport = index < firstVisible || index >= firstVisible + viewportRows
    if (index < boundedStart || index >= boundedStart + props.windowing.size || outsideViewport) {
      const overscan = props.windowing.overscan ?? 12
      const scrollRow = Math.max(0, index - Math.floor(viewportRows / 2))
      setWindowStart(Math.min(maximumStart, Math.max(0, scrollRow - overscan)))
      viewport.current && (viewport.current.scrollTop = scrollRow * props.windowing.rowHeight)
    }
    return true
  }
  const focus = (id = focusKey ?? "", reveal = true) => {
    if (reveal) ensureWindow(id)
    const target = refs.current.get(id)
    if (target !== undefined && !target.hidden) target.focus({preventScroll: true})
    else if (reveal && ensureWindow(id)) pendingFocus.current = id
  }
  const reveal = (id: string): boolean => {
    const element = refs.current.get(id)
    if (element === undefined || element.hidden) {
      if (!ensureWindow(id)) return false
      pendingReveal.current = id
      return true
    }
    const row = element.querySelector("[data-tree-row]")
    if (row === null) return false
    row.scrollIntoView({block: "nearest", inline: "nearest"})
    return true
  }
  useLayoutEffect(() => {
    props.onReady?.(Object.freeze({focus, reveal}))
    return () => props.onReady?.(null)
  }, [props.onReady, focusKey, boundedStart])
  useLayoutEffect(() => {
    const id = pendingFocus.current
    if (id !== null && refs.current.get(id)?.hidden === false) {
      pendingFocus.current = null
      refs.current.get(id)?.focus({preventScroll: true})
    }
    const revealId = pendingReveal.current
    if (revealId !== null && refs.current.get(revealId)?.hidden === false) {
      pendingReveal.current = null
      refs.current.get(revealId)?.querySelector("[data-tree-row]")?.scrollIntoView({block: "nearest", inline: "nearest"})
    }
  })
  useLayoutEffect(() => {
    for (const [id, element] of refs.current) {
      const tabIndex = id === focusKey && !element.hidden ? 0 : -1
      if (!element.hasAttribute("tabindex") || element.tabIndex !== tabIndex) element.tabIndex = tabIndex
    }
  }, [focusKey, blocks])
  useLayoutEffect(() => {
    if (previousResetKey.current === props.windowing?.resetKey) return
    previousResetKey.current = props.windowing?.resetKey
    setWindowStart(0)
    if (viewport.current !== null) viewport.current.scrollTop = 0
  }, [props.windowing?.resetKey])
  const toggle = (id: string, event: Event) => {
    const branch = refs.current.get(id)
    const active = branch?.ownerDocument.activeElement
    if (expanded.has(id) && branch !== undefined && active != null && active !== branch && branch.contains(active)) {
      if (props.selectionFollowsFocus === false) setFocusedId(id)
      branch.focus({preventScroll: true})
    }
    const next = new Set(expanded)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    props.onExpandedChange?.([...next], event)
  }
  const select = (id: string, event: MouseEvent | KeyboardEvent) => {
    const item = rows.find(row => row.item.id === id)?.item
    if (item === undefined || item.disabled) return
    if (item.selectable === false) {
      if (item.expandable ?? (item.children?.length ?? 0) > 0) toggle(id, event)
      if (props.selectionFollowsFocus === false) setFocusedId(id)
      focus(id, event.type === "keydown")
      return
    }
    let keys = [id]
    if (props.selectionMode === "multiple" && event.shiftKey && anchor.current !== null) {
      const first = rows.findIndex(row => row.item.id === anchor.current)
      const last = rows.findIndex(row => row.item.id === id)
      if (first >= 0) keys = rows.slice(Math.min(first, last), Math.max(first, last) + 1).filter(row => !row.item.disabled).map(row => row.item.id)
    } else if (props.selectionMode === "multiple" && (event.metaKey || event.ctrlKey)) {
      const next = new Set(selected)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      keys = [...next]
      anchor.current = id
    } else anchor.current = id
    props.onSelectionChange?.(keys, event)
    if (props.selectionFollowsFocus === false) setFocusedId(id)
    focus(id, event.type === "keydown")
  }
  const context: TreeContext = {
    expanded, selected, focusKey, refs: refs.current, rowHeight: props.windowing?.rowHeight ?? 24,
    select, toggle,
    focusIn: id => { if (props.selectionFollowsFocus === false) setFocusedId(id) },
    activate: (id, event) => {
      const item = rows.find(row => row.item.id === id)?.item
      if (item === undefined || item.disabled) return
      if (item.selectable === false) toggle(id, event)
      else props.onActivate?.(id, event)
    },
    key(id, event) {
      const index = rows.findIndex(row => row.item.id === id)
      const current = rows[index]
      if (!current || current.item.disabled) return
      let next: TreeRow | undefined
      if (event.key === "ArrowDown") next = rows.slice(index + 1).find(row => !row.item.disabled)
      else if (event.key === "ArrowUp") next = rows.slice(0, index).reverse().find(row => !row.item.disabled)
      else if (event.key === "Home") next = rows.find(row => !row.item.disabled)
      else if (event.key === "End") next = [...rows].reverse().find(row => !row.item.disabled)
      else if (event.key === "ArrowRight" && (current.item.expandable ?? (current.item.children?.length ?? 0) > 0)) {
        if (!expanded.has(id)) toggle(id, event)
        else next = rows.slice(index + 1).find(row => !row.item.disabled && isTreeDescendant(row, id, rows))
      } else if (event.key === "ArrowLeft") {
        if (expanded.has(id)) toggle(id, event)
        else next = rows.find(row => row.item.id === current.parent)
      } else if (event.key === "Enter") context.activate(id, event)
      else if (event.key === " ") select(id, event)
      else return
      event.preventDefault()
      if (next) {
        if (props.selectionFollowsFocus === false) {
          setFocusedId(next.item.id)
          focus(next.item.id)
        } else select(next.item.id, event)
      }
    },
  }
  const empty = props.items.length === 0 ? props.emptyLabel ?? "Нет элементов" : ""
  return <section
    data-widget="tree"
    data-tree-embedded={props.embedded === true ? "true" : undefined}
    aria-label={props.title}
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border: var(--border-width-control) solid var(--widget-toolbar-outline);
      border-radius: 6px;
      background: var(--widget-text-background);

      &[data-tree-embedded="true"] {
        border: 0;
        border-radius: 0;
      }

      ${props.style}
    `}
  >
    {props.embedded === true ? null : <WidgetHeader
      title={props.title}
      subtitle={props.subtitle}
      status={props.status}
      statusTone={props.statusTone}
      actions={props.actions}
    />}
    <ul
      ref={element => { viewport.current = element }}
      role="tree"
      aria-label={props.title}
      aria-multiselectable={String(props.selectionMode === "multiple")}
      data-tree-total={props.windowing === undefined ? undefined : String(windowRows.length)}
      data-tree-materialized={blocks === undefined ? undefined : String(materializedTreeRows(blocks))}
      data-tree-window-start={props.windowing === undefined ? undefined : String(boundedStart)}
      onScroll={event => {
        if (props.windowing === undefined) return
        const height = readElementLayoutRect(event.currentTarget)?.height ?? 0
        const viewRows = height > 0 ? Math.ceil(height / props.windowing.rowHeight) + 1 : props.windowing.viewRows ?? 20
        const next = treeScrollWindowStart(
          Math.floor(event.currentTarget.scrollTop / props.windowing.rowHeight),
          viewRows, boundedStart, props.windowing.size, windowRows.length, props.windowing.overscan ?? 12,
        )
        if (next !== boundedStart) setWindowStart(next)
      }}
      style={css`
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 0;
        min-width: 0;
        margin: 0;
        padding: ${props.embedded === true ? 0 : 4}px;
        overflow: auto;
        list-style: none;
        user-select: none;
      `}
    >
      {blocks === undefined ? <TreePlainRows
        items={props.items}
        context={context}
        depth={1}
      /> : <TreeWindowedRows
        blocks={blocks}
        context={context}
        depth={1}
      />}
    </ul>
    <span
      hidden={props.items.length > 0}
      style={css`
        padding: 4px 8px;
        color: var(--widget-text-content-readonly);

        &[hidden] {
          display: none;
        }
      `}
    >
      {empty}
    </span>
  </section>
}
