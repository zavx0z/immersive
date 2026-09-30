import type {TreeContext} from "../contract/types.ts"
import type {TreeItem} from "../contract/types.ts"
import type {TreeItemBlock} from "../contract/types.ts"
import type {TreeRow} from "../contract/types.ts"
import Button from "@ui-buttons/button"
import chevronDownIcon from "@ui-themes-icons/chevron-down"
import chevronRightIcon from "@ui-themes-icons/chevron-right"
import WidgetActionButton from "@ui-widgets-header/action"
import type {WindowedTreeBlock} from "./windowing.ts"

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreeBranch(props: Readonly<{
  item: TreeItem
  context: TreeContext
  depth: number
  block?: TreeItemBlock | undefined
}>) {
  const item = props.item
  const children = item.children ?? []
  const expandable = item.expandable ?? children.length > 0
  const expanded = props.context.expanded.has(item.id)
  const selected = props.context.selected.has(item.id)
  const toggleLabel = expanded ? "Свернуть" : "Раскрыть"
  return <li
    ref={element => {
      if (element) props.context.refs.set(item.id, element)
      else props.context.refs.delete(item.id)
    }}
    role="treeitem"
    data-tree-id={item.id}
    hidden={props.block?.hidden === true}
    aria-label={item.label}
    aria-level={props.depth}
    aria-selected={item.selectable === false ? undefined : String(selected)}
    aria-current={item.current === true ? "page" : undefined}
    aria-expanded={expandable ? String(expanded) : undefined}
    aria-disabled={String(item.disabled === true)}
    tabIndex={props.context.focusKey === item.id ? 0 : -1}
    onClick={event => {
      if (event.target === event.currentTarget) props.context.select(item.id, event)
    }}
    onDoubleClick={event => {
      if (event.target === event.currentTarget) props.context.activate(item.id, event)
    }}
    onKeyDown={event => {
      if (event.target !== event.currentTarget) return
      props.context.key(item.id, event)
    }}
    onFocusIn={event => { if (event.target === event.currentTarget) props.context.focusIn(item.id) }}
    style={css`
      display: flex;
      flex-direction: column;
      min-width: 0;
      width: 100%;
      list-style: none;

      &[hidden] {
        display: none;
      }
    `}
  >
    <div
      data-tree-row=""
      data-selected={String(selected)}
      data-disabled={String(item.disabled === true)}
      data-muted={String(item.muted === true)}
      data-tone={item.tone}
      onClick={event => props.context.select(item.id, event)}
      onDoubleClick={event => props.context.activate(item.id, event)}
      style={css`
        box-sizing: border-box;
        display: flex;
        flex-direction: row;
        align-items: center;
        min-width: 0;
        width: 100%;
        min-height: 24px;
        gap: 4px;
        padding: 2px 5px;
        border-radius: 3px;
        color: var(--widget-list-content);
        font-size: var(--font-size-xs);

        &:hover {
          background: var(--widget-regular-background);
        }

        &[data-selected="true"] {
          background: var(--widget-list-background-selected);
          color: var(--widget-list-content-selected);
        }

        &[data-disabled="true"] {
          opacity: 0.5;
        }

        &[data-muted="true"] {
          color: var(--widget-text-content-readonly);
        }

        &[data-tone="success"] {
          border-left: 2px solid var(--state-success);
        }

        &[data-tone="warning"] {
          border-left: 2px solid var(--state-warning);
        }

        &[data-tone="error"] {
          border-left: 2px solid var(--state-error);
        }

        &[data-tone="info"] {
          border-left: 2px solid var(--state-info);
        }
      `}
    >
      <span
        style={css`
          display: flex;
          width: 20px;
          min-width: 20px;
        `}
      >
        {expandable ? <Button
          label={toggleLabel}
          startIcon={expanded ? chevronDownIcon : chevronRightIcon}
          iconOnly={true}
          iconSize={12}
          title={toggleLabel}
          aria-label={toggleLabel}
          disabled={item.disabled === true}
          onClick={event => { event.stopPropagation(); props.context.toggle(item.id, event) }}
          style={css`
            width: 20px;
            min-width: 20px;
            height: 20px;
            padding: 0;
            border: 0;
            background: transparent;
            box-shadow: none;
          `}
        /> : null}
      </span>
      <img
        src={item.iconSrc ?? ""}
        alt=""
        hidden={item.iconSrc === undefined}
        width={16}
        height={16}
        style={css`
          width: 16px;
          height: 16px;
          object-fit: contain;
          flex-shrink: 0;

          &[hidden] {
            display: none;
          }
        `}
      />
      <span
        data-tree-label=""
        title={item.title ?? item.label}
        style={css`
          flex-grow: 1;
          min-width: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `}
      >
        {item.label}
      </span>
      <span
        style={css`
          color: var(--widget-text-content-readonly);
          white-space: nowrap;
        `}
      >
        {item.detail ?? ""}
      </span>
      {(item.actions ?? []).map(action => <WidgetActionButton
        key={action.id}
        action={action}
        stopPropagation={true}
      />)}
    </div>
    {(expanded && children.length > 0 || props.block?.children.length) ? <TreeChildren
      items={children}
      blocks={props.block?.children}
      context={props.context}
      depth={props.depth + 1}
    /> : null}
  </li>
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreeChildren(props: Readonly<{
  items: readonly TreeItem[]
  blocks?: readonly WindowedTreeBlock<TreeItem>[] | undefined
  context: TreeContext
  depth: number
}>) {
  return <ul
    role="group"
    style={css`
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      width: 100%;
      min-width: 0;
      margin: 0;
      padding: 0 0 0 16px;
      list-style: none;
    `}
  >
    {props.blocks === undefined ? <TreePlainRows
      items={props.items}
      context={props.context}
      depth={props.depth}
    /> : <TreeWindowedRows
      blocks={props.blocks}
      context={props.context}
      depth={props.depth}
    />}
  </ul>
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreePlainRows(props: Readonly<{items: readonly TreeItem[]; context: TreeContext; depth: number}>) {
  return <>
    {props.items.map(item => <TreeBranch
      key={item.id}
      item={item}
      context={props.context}
      depth={props.depth}
    />)}
  </>
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreeWindowedRows(props: Readonly<{
  blocks: readonly WindowedTreeBlock<TreeItem>[]
  context: TreeContext
  depth: number
}>) {
  return <>
    {props.blocks.map(block => <TreeBlockView
      key={block.kind === "spacer" ? block.key : block.item.id}
      block={block}
      context={props.context}
      depth={props.depth}
    />)}
  </>
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreeBlockView(props: Readonly<{
  block: WindowedTreeBlock<TreeItem>
  context: TreeContext
  depth: number
}>) {
  const block = props.block
  return <>
    {block.kind === "spacer" ? <TreeSpacer
      rows={block.rows}
      rowHeight={props.context.rowHeight}
    /> : <TreeBranch
      item={block.item}
      context={props.context}
      depth={props.depth}
      block={block}
    />}
  </>
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function TreeSpacer(props: Readonly<{rows: number; rowHeight: number}>) {
  return <li
    role="presentation"
    style={css`
      height: ${props.rows * props.rowHeight}px;
      min-height: ${props.rows * props.rowHeight}px;
      list-style: none;
    `}
  />
}

/** Частная подготовка дерево с выбором, навигацией и ограниченным окном материализованных строк. */
export function isTreeDescendant(row: TreeRow, ancestorId: string, rows: readonly TreeRow[]): boolean {
  let parent = row.parent
  while (parent !== null) {
    if (parent === ancestorId) return true
    parent = rows.find(candidate => candidate.item.id === parent)?.parent ?? null
  }
  return false
}
