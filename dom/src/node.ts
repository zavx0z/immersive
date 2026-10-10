import {eventTransaction} from "./internal/dom-work.ts"
import type {Event} from "./event.ts"
import {replaceDOMRangeContent} from "./dom-range.ts"
import {DOMGroup, groupRange, groupParking, groupStartingAt, replaceGroupContent, insertGroupContent} from "./dom-group.ts"
import {lifecycleInserted, lifecycleRemoving, lifecycleAdopted, lifecycleContentChanged} from "./internal/lifecycle.ts"
import {EventTarget} from "./event-target.ts"
import {isCustomElementHost} from "./internal/custom-elements.ts"
import {domError} from "./internal/errors.ts"
import {clearFocusInSubtree} from "./internal/focus.ts"
import {closePopoversInSubtree} from "./internal/popover.ts"
import {closeSelectPickersInSubtree} from "./select-picker-state.ts"
import {hasDocumentRanges, updateDocumentRanges} from "./internal/live-ranges.ts"
import {invalidateTextPositionIndexes} from "./internal/text-position-index.ts"
import {validateRangeInsertion} from "./internal/range-insertion.ts"
import type {Document} from "./document.ts"
import type {Element} from "./element.ts"
import type {ChildListMutation} from "./mutation.ts"

function isElementNode(node: Node): node is Element {
  return node.nodeType === Node.ELEMENT_NODE
}

function mutationDocument(node: Node): Document | null {
  return node.nodeType === Node.DOCUMENT_NODE ? node as unknown as Document : node.ownerDocument
}

export type NodeOrString = Node | DOMGroup | string

export abstract class Node extends EventTarget {
  static readonly ELEMENT_NODE = 1
  static readonly TEXT_NODE = 3
  static readonly COMMENT_NODE = 8
  static readonly DOCUMENT_NODE = 9
  static readonly DOCUMENT_FRAGMENT_NODE = 11

  readonly ELEMENT_NODE = Node.ELEMENT_NODE
  readonly TEXT_NODE = Node.TEXT_NODE
  readonly COMMENT_NODE = Node.COMMENT_NODE
  readonly DOCUMENT_NODE = Node.DOCUMENT_NODE
  readonly DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE

  readonly nodeType: number
  readonly nodeName: string

  private nodeDocument: Document | null
  private parent: Node | null = null
  private previous: Node | null = null
  private next: Node | null = null
  private first: Node | null = null
  private last: Node | null = null
  private childCount = 0

  protected constructor(ownerDocument: Document | null, nodeType: number, nodeName: string) {
    super()
    this.nodeDocument = ownerDocument
    this.nodeType = nodeType
    this.nodeName = nodeName
  }

  get ownerDocument(): Document | null {
    return this.nodeDocument
  }

  get parentNode(): Node | null {
    return this.parent
  }

  get parentElement(): Element | null {
    return this.parent && isElementNode(this.parent) ? this.parent : null
  }

  get previousSibling(): Node | null {
    return this.previous
  }

  get nextSibling(): Node | null {
    return this.next
  }

  get firstChild(): Node | null {
    return this.first
  }

  get lastChild(): Node | null {
    return this.last
  }

  get childNodes(): readonly Node[] {
    const children: Node[] = []
    for (let child = this.first; child; child = child.next) children.push(child)
    return children
  }

  get isConnected(): boolean {
    return this.getRootNode().nodeType === Node.DOCUMENT_NODE
  }

  get nodeValue(): string | null {
    return null
  }

  set nodeValue(_value: string | null) {}

  get textContent(): string | null {
    return null
  }

  set textContent(_value: string | null) {}

  /** Событие и все его listeners завершают одну транзакцию того же Document. */
  override dispatchEvent(event: Event): boolean {
    const document = mutationDocument(this)
    return document ? document[eventTransaction](() => super.dispatchEvent(event)) : super.dispatchEvent(event)
  }

  hasChildNodes(): boolean {
    return this.first !== null
  }

  getRootNode(): Node {
    let root: Node = this
    while (root.parent) root = root.parent
    return root
  }

  contains(other: Node | null): boolean {
    for (let current = other; current; current = current.parent) {
      if (current === this) return true
    }
    return false
  }

  appendChild<T extends Node | DOMGroup>(node: T): T {
    return this.insertBefore(node, null)
  }

  [validateRangeInsertion](node: Node, reference: Node | null): void {
    if (!this.canHaveChildren()) throw domError("HierarchyRequestError", `${this.nodeName} cannot contain child nodes`)
    if (reference && reference.parent !== this) throw domError("NotFoundError", "The reference child does not belong to this parent")
    const nodes = node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? node.childNodes : [node]
    this.validateInsertion(nodes, [])
  }

  insertBefore<T extends Node | DOMGroup>(node: T, child: Node | DOMGroup | null): T {
    if (child instanceof DOMGroup) child = child[groupRange]()[0]!
    if (!this.canHaveChildren()) {
      throw domError("HierarchyRequestError", `${this.nodeName} cannot contain child nodes`)
    }
    if (child && child.parent !== this) {
      throw domError("NotFoundError", "The reference child does not belong to this parent")
    }
    if (node === child) return node
    if ((node as Node | DOMGroup) === this || node instanceof Node && node.contains(this)) {
      throw domError("HierarchyRequestError", "The insertion would create a tree cycle")
    }

    const inserted = node instanceof DOMGroup ? [...node[groupRange]()] : node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? [...node.childNodes] : [node as Node]
    this.validateInsertion(inserted, [])
    const document = mutationDocument(this)
    const mutate = () => this.insertNodes(inserted, child)
    if (document) document.transaction(mutate)
    else mutate()
    return node
  }

  removeChild<T extends Node | DOMGroup>(child: T): T {
    if (child instanceof DOMGroup) {
      if (child.parentNode !== this) throw domError("NotFoundError", "The group does not belong to this parent")
      child.remove()
      return child
    }
    if (child.parent !== this) throw domError("NotFoundError", "The child does not belong to this parent")
    const document = mutationDocument(this)
    const mutate = () => child.detach(true)
    if (document) document.transaction(mutate)
    else mutate()
    return child
  }

  replaceChild<T extends Node>(node: Node | DOMGroup, child: T): T {
    if (child.parent !== this) throw domError("NotFoundError", "The child does not belong to this parent")
    if (node === child) return child
    if (node === this || node instanceof Node && node.contains(this)) {
      throw domError("HierarchyRequestError", "The replacement would create a tree cycle")
    }

    const inserted = node instanceof DOMGroup ? [...node[groupRange]()] : node.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? [...node.childNodes] : [node as Node]
    this.validateInsertion(inserted, [child])
    const document = mutationDocument(this)
    const mutate = () => this.replaceNodeWithNodes(inserted, child)
    if (document) document.transaction(mutate)
    else mutate()
    return child
  }

  protected appendNodes(...nodes: NodeOrString[]): void {
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      this.validateInsertion(inserted, [])
      this.insertNodes(inserted, null)
    })
  }

  protected prependNodes(...nodes: NodeOrString[]): void {
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      this.validateInsertion(inserted, [])
      this.insertNodes(inserted, this.first)
    })
  }

  protected replaceChildrenNodes(...nodes: NodeOrString[]): void {
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      this.validateInsertion(inserted, this.childNodes)
      const removed = [...this.childNodes]
      const insertedSet = new Set(inserted)
      const document = connectedMutationDocument(this)
      this.parkRemovedGroups(removed, insertedSet)
      for (const child of removed) {
        if (child.parent === this) child.detach(false, insertedSet.has(child) ? document : null, insertedSet)
      }
      for (const child of inserted) child.detach(true, document, insertedSet)
      for (const child of inserted) {
        this.adopt(child)
        this.linkBefore(child, null)
      }
      if (removed.length > 0 || inserted.length > 0) {
        this.recordChildMutation(inserted, removed, null, null)
      }
    })
  }

  protected beforeNodes(...nodes: NodeOrString[]): void {
    const parent = this.parent
    if (!parent) return
    const nodeArguments = new Set(nodes.filter((node): node is Node => node instanceof Node))
    let viablePreviousSibling = this.previous
    while (viablePreviousSibling && nodeArguments.has(viablePreviousSibling)) {
      viablePreviousSibling = viablePreviousSibling.previous
    }
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      const reference = viablePreviousSibling ? viablePreviousSibling.next : parent.first
      parent.validateInsertion(inserted, [])
      parent.insertNodes(inserted, reference)
    })
  }

  protected afterNodes(...nodes: NodeOrString[]): void {
    const parent = this.parent
    if (!parent) return
    const nodeArguments = new Set(nodes.filter((node): node is Node => node instanceof Node))
    let viableNextSibling = this.next
    while (viableNextSibling && nodeArguments.has(viableNextSibling)) {
      viableNextSibling = viableNextSibling.next
    }
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      parent.validateInsertion(inserted, [])
      parent.insertNodes(inserted, viableNextSibling)
    })
  }

  protected replaceWithNodes(...nodes: NodeOrString[]): void {
    const parent = this.parent
    if (!parent) return
    const nodeArguments = new Set(nodes.filter((node): node is Node => node instanceof Node))
    let viableNextSibling = this.next
    while (viableNextSibling && nodeArguments.has(viableNextSibling)) {
      viableNextSibling = viableNextSibling.next
    }
    this.withMutationTransaction(() => {
      const inserted = this.convertNodes(nodes)
      if (inserted.includes(this)) {
        parent.validateInsertion(inserted, [])
        parent.insertNodes(inserted, viableNextSibling)
        return
      }
      parent.validateInsertion(inserted, [this])
      parent.replaceNodeWithNodes(inserted, this)
    })
  }

  protected removeNode(): void {
    this.parent?.removeChild(this)
  }

  protected descendantTextContent(): string {
    let content = ""
    const visit = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        content += node.nodeValue ?? ""
        return
      }
      for (const child of node.childNodes) visit(child)
    }
    for (const child of this.childNodes) visit(child)
    return content
  }

  protected replaceAllWithText(value: string | null): void {
    const document = mutationDocument(this)
    const mutate = () => {
      const removed = [...this.childNodes]
      const normalized = value === null ? "" : String(value)
      const added = normalized === "" || !document ? [] : [document.createTextNode(normalized)]
      this.validateInsertion(added, removed)
      this.parkRemovedGroups(removed, new Set())
      for (const child of removed) if (child.parent === this) child.detach(false)
      for (const child of added) this.linkBefore(child, null)
      if (removed.length > 0 || added.length > 0) {
        this.recordChildMutation(added, removed, null, null)
      }
    }
    if (document) document.transaction(mutate)
    else mutate()
  }

  protected override eventParent(): EventTarget | null {
    return this.parent
  }

  protected validateChildInsertion(
    _nodes: readonly Node[],
    _replacing: readonly Node[],
  ): void {}

  protected validateDescendantInsertion(
    _target: Node, _nodes: readonly Node[], _replacing: readonly Node[],
  ): void {}

  protected validateTextChange(value: string): void {
    if (this.nodeType !== Node.TEXT_NODE) return
    let owner = this.parentNode
    while (owner !== null) {
      owner.validateDescendantTextChange(this, value)
      if (!isCustomElementHost(owner)) break
      owner = owner.parentNode
    }
  }

  protected validateDescendantTextChange(_target: Node, _value: string): void {}

  private canHaveChildren(): boolean {
    return this.nodeType === Node.DOCUMENT_NODE ||
      this.nodeType === Node.DOCUMENT_FRAGMENT_NODE ||
      this.nodeType === Node.ELEMENT_NODE
  }

  private validateInsertion(nodes: readonly Node[], replacing: readonly Node[]): void {
    for (const node of nodes) {
      if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        throw domError("HierarchyRequestError", "Document and DocumentFragment nodes cannot be inserted")
      }
      if (node === this || node.contains(this)) {
        throw domError("HierarchyRequestError", "The insertion would create a tree cycle")
      }
    }

    if (this.nodeType === Node.DOCUMENT_NODE) {
      if (nodes.some(node => node.nodeType === Node.TEXT_NODE)) {
        throw domError("HierarchyRequestError", "A Document cannot contain Text children")
      }
      const replaced = new Set(replacing)
      const moving = new Set(nodes.filter(node => node.parent === this))
      const retainedElementCount = this.childNodes.filter(candidate =>
        !replaced.has(candidate) && !moving.has(candidate) && candidate.nodeType === Node.ELEMENT_NODE
      ).length
      const insertedElementCount = nodes.filter(node => node.nodeType === Node.ELEMENT_NODE).length
      if (retainedElementCount + insertedElementCount > 1) {
        throw domError("HierarchyRequestError", "A Document can contain at most one Element child")
      }
    }

    this.validateChildInsertion(nodes, replacing)
    // Только custom hosts прозрачны для проверки пространственного владельца.
    let host: Node = this
    while (isCustomElementHost(host) && host.parentNode !== null) {
      host.parentNode.validateDescendantInsertion(this, nodes, replacing)
      host = host.parentNode
    }
  }

  private convertNodes(nodes: readonly NodeOrString[]): readonly Node[] {
    const document = mutationDocument(this)
    if (!document) throw domError("InvalidStateError", "The node has no associated Document")
    const converted: Node[] = []
    for (const node of nodes) {
      if (node instanceof DOMGroup) converted.push(...node[groupRange]())
      else converted.push(node instanceof Node ? node : document.createTextNode(String(node)))
    }
    const result: Node[] = []
    const fragmentChildren = new Map<Node, Node[]>()
    const childrenOf = (fragment: Node): Node[] => {
      let children = fragmentChildren.get(fragment)
      if (children === undefined) {
        children = [...fragment.childNodes]
        fragmentChildren.set(fragment, children)
      }
      return children
    }
    const removeFromVirtualParent = (node: Node): void => {
      const resultIndex = result.indexOf(node)
      if (resultIndex >= 0) result.splice(resultIndex, 1)
      const parent = node.parentNode
      if (parent?.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return
      const siblings = childrenOf(parent)
      const siblingIndex = siblings.indexOf(node)
      if (siblingIndex >= 0) siblings.splice(siblingIndex, 1)
    }
    const append = (node: Node): void => {
      removeFromVirtualParent(node)
      result.push(node)
    }

    for (const node of converted) {
      if (node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        append(node)
        continue
      }
      const children = [...childrenOf(node)]
      childrenOf(node).length = 0
      for (const child of children) append(child)
    }
    return result
  }

  private withMutationTransaction<Result>(callback: () => Result): Result {
    const document = mutationDocument(this)
    return document ? document.transaction(callback) : callback()
  }

  [insertGroupContent](group: DOMGroup, content: readonly NodeOrString[], before: Node): void {
    this.withMutationTransaction(() => {
      const range = group[groupRange]()
      if (range[0]!.parentNode !== this) throw domError("NotFoundError", "DOMGroup does not belong to this parent")
      const inserted = this.convertNodes(content)
      if (inserted.includes(range[0]!) || inserted.includes(range.at(-1)!)) throw domError("HierarchyRequestError", "DOMGroup cannot contain its boundaries")
      this.validateInsertion(inserted, [])
      this.insertNodes(inserted, before)
    })
  }

  [replaceGroupContent](group: DOMGroup, content: readonly NodeOrString[]): void {
    const range = group[groupRange]()
    this[replaceDOMRangeContent](range[0]!, range.at(-1)!, content)
  }

  [replaceDOMRangeContent](start: Node, end: Node, content: readonly NodeOrString[]): void {
    this.withMutationTransaction(() => {
      if (start === end || start.parentNode !== this || end.parentNode !== this) throw domError("InvalidStateError", "DOM range boundaries must share one parent")
      const removed: Node[] = []
      let cursor = start.nextSibling
      while (cursor && cursor !== end) {
        removed.push(cursor)
        cursor = cursor.nextSibling
      }
      if (cursor !== end) throw domError("InvalidStateError", "DOM range boundaries must preserve their order")
      const inserted = this.convertNodes(content)
      if (inserted.includes(start) || inserted.includes(end)) throw domError("HierarchyRequestError", "DOM range cannot contain its boundaries")
      this.validateInsertion(inserted, removed)
      const retained = new Set(inserted)
      this.parkRemovedGroups(removed, retained)
      const document = connectedMutationDocument(this)
      const detached: Node[] = []
      for (const node of removed) if (!retained.has(node) && node.parent === this) {
        detached.push(node)
        node.detach(false)
      }
      const added: Node[] = []
      let before = end
      for (let index = inserted.length - 1; index >= 0; index--) {
        const node = inserted[index]!
        if (node.parent !== this || node.next !== before) {
          if (node.parent === this) detached.push(node)
          node.detach(node.parent !== this, document, retained)
          this.adopt(node)
          this.linkBefore(node, before)
          added.push(node)
        }
        before = node
      }
      if (added.length || detached.length || removed.some(node => !retained.has(node))) {
        this.recordChildMutation(added.reverse(), removed.filter(node => !retained.has(node)).concat(detached.filter(node => retained.has(node))), start, end)
      }
    })
  }

  private parkRemovedGroups(removed: readonly Node[], retained: ReadonlySet<Node>): void {
    const removing = new Set(removed)
    for (const node of removed) {
      const group = groupStartingAt(node)
      if (!group || node.parentNode !== this) continue
      const range = group[groupRange]()
      if (!range.every(node => removing.has(node))) continue
      const parking = group[groupParking]()
      for (const child of range) {
        if (retained.has(child)) continue
        child.detach(false)
        parking.adopt(child)
        parking.linkBefore(child, null)
      }
    }
  }

  private insertNodes(nodes: readonly Node[], reference: Node | null): void {
    if (nodes.length === 0) return
    const moving = new Set(nodes)
    let viableReference = reference
    while (viableReference && moving.has(viableReference)) {
      viableReference = viableReference.next
    }
    const document = connectedMutationDocument(this)
    for (const node of nodes) node.detach(true, document, moving)
    const previousSibling = viableReference ? viableReference.previous : this.last
    for (const node of nodes) {
      this.adopt(node)
      this.linkBefore(node, viableReference)
    }
    this.recordChildMutation(nodes, [], previousSibling, viableReference)
  }

  private replaceNodeWithNodes(nodes: readonly Node[], child: Node): void {
    const before = [...this.childNodes]
    const childIndex = before.indexOf(child)
    const insertedSet = new Set(nodes)
    let insertionIndex = 0
    for (let index = 0; index < childIndex; index += 1) {
      const candidate = before[index]
      if (candidate && !insertedSet.has(candidate)) insertionIndex += 1
    }

    child.detach(true)
    const stateDocument = connectedMutationDocument(this)
    for (const candidate of nodes) candidate.detach(true, stateDocument, insertedSet)
    const remaining = [...this.childNodes]
    const reference = remaining[insertionIndex] ?? null
    this.insertNodes(nodes, reference)
  }

  private adopt(node: Node): void {
    const document = mutationDocument(this)
    if (!document || node.nodeDocument === document) return
    const visit = (current: Node): void => {
      if (current.nodeType !== Node.DOCUMENT_NODE) {
        const previous = current.nodeDocument
        current.nodeDocument = document
        lifecycleAdopted(current, previous, document)
      }
      for (const child of current.childNodes) visit(child)
    }
    visit(node)
  }

  private linkBefore(node: Node, reference: Node | null): void {
    const previous = reference ? reference.previous : this.last
    const document = mutationDocument(this)
    const tracksRanges = hasDocumentRanges(document)
    const index = tracksRanges && reference ? this.childNodes.indexOf(reference) : this.childCount
    node.parent = this
    node.previous = previous
    node.next = reference
    if (previous) previous.next = node
    else this.first = node
    if (reference) reference.previous = node
    else this.last = node
    this.childCount += 1
    invalidateTextPositionIndexes(this)
    if (tracksRanges) updateDocumentRanges(document, {type: "insert", parent: this, index})
    lifecycleInserted(node)
  }

  private detach(record: boolean, destinationDocument: Document | null = null, moving?: ReadonlySet<Node>): void {
    const parent = this.parent
    if (!parent) return
    lifecycleRemoving(this, destinationDocument, moving)
    invalidateTextPositionIndexes(parent)
    const document = mutationDocument(this)
    const preservesDocumentState = document !== null && document === destinationDocument
    if (hasDocumentRanges(document)) {
      updateDocumentRanges(document, {
        type: "remove",
        parent,
        node: this,
        index: parent.childNodes.indexOf(this),
        preserve: preservesDocumentState,
      })
    }
    if (!preservesDocumentState) {
      document?.[clearFocusInSubtree](this)
      closePopoversInSubtree(this)
      closeSelectPickersInSubtree(this)
    }
    const previous = this.previous
    const next = this.next
    if (previous) previous.next = next
    else parent.first = next
    if (next) next.previous = previous
    else parent.last = previous
    this.parent = null
    this.previous = null
    this.next = null
    parent.childCount -= 1
    if (record) parent.recordChildMutation([], [this], previous, next)
  }

  private recordChildMutation(
    addedNodes: readonly Node[],
    removedNodes: readonly Node[],
    previousSibling: Node | null,
    nextSibling: Node | null
  ): void {
    lifecycleContentChanged(this)
    const document = mutationDocument(this)
    if (!document || !this.isConnected) return
    const mutation: ChildListMutation = {
      type: "childList",
      target: this,
      addedNodes: [...addedNodes],
      removedNodes: [...removedNodes],
      previousSibling,
      nextSibling
    }
    document.recordMutation(mutation)
  }
}

function connectedMutationDocument(node: Node): Document | null {
  const document = mutationDocument(node)
  if (document === null) return null
  return node === document || node.getRootNode() === document ? document : null
}
