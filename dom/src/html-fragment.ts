import type {DefaultTreeAdapterTypes as HTMLTree} from "parse5"
import type {Document} from "./document.ts"
import type {DocumentFragment} from "./document-fragment.ts"
import type {Element} from "./element.ts"
import type {Node} from "./node.ts"
import {domError} from "./internal/errors.ts"

export type HTMLFragmentSyntaxNode = Readonly<{
  type: "element"
  name: string
  attrs: readonly Readonly<{name: string; value: string}>[]
  children: readonly HTMLFragmentSyntaxNode[]
}> | Readonly<{type: "text"; value: string}> | Readonly<{type: "comment"; value: string}>

type HTMLParser = typeof import("parse5")
let implementation: HTMLParser | undefined
// Bun и browser bundle откладывают инициализацию parser до явного строкового авторства.
const parser = (): HTMLParser => implementation ??= require("parse5") as HTMLParser

/**
Разбирает HTML в readonly syntax без создания semantic Nodes или custom constructors.

Текст и атрибуты уже entity-decoded. Структура следует HTML fragment context;
Template может кэшировать её, сохраняя единственного владельца HTML grammar.
*/
export function parseFragmentSource(source: string, contextTagName = "body"): readonly HTMLFragmentSyntaxNode[] {
  if (typeof source !== "string") throw new TypeError("HTML fragment source must be a string")
  if (typeof contextTagName !== "string" || contextTagName.length === 0) throw new TypeError("HTML fragment context must have a tag name")
  const {defaultTreeAdapter: adapter, html, parseFragment: parseHTML} = parser()
  const name = contextTagName.toLowerCase()
  supportedElement(name)
  const context = adapter.createElement(name, html.NS.HTML, [])
  const fragment = parseHTML(context, source, {})
  return Object.freeze(fragment.childNodes.map(syntaxNode))
}

/** Возвращает отсоединённый fragment того же Document, используя его обычные фабрики и reactions. */
export function parseFragment(document: Document, source: string, contextElement?: Element): DocumentFragment {
  if (contextElement !== undefined && contextElement.ownerDocument !== document) {
    throw domError("WrongDocumentError", "HTML fragment context belongs to another Document")
  }
  const syntax = parseFragmentSource(source, contextElement?.localName)
  return document.transaction(() => {
    const fragment = document.createDocumentFragment()
    for (const child of syntax) fragment.appendChild(materialize(document, child))
    return fragment
  })
}

/** Читает HTML-сериализацию детей без изменения Nodes, состояния и lifecycle. */
export function serializeFragment(root: Element | DocumentFragment): string {
  if (!root.hasChildNodes()) return ""
  const {defaultTreeAdapter: adapter, serialize} = parser()
  const tree = root.nodeType === 1 ? serializationNode(root) as HTMLTree.Element : adapter.createDocumentFragment()
  if (root.nodeType !== 1) {
    for (const child of root.childNodes) adapter.appendChild(tree as HTMLTree.DocumentFragment, serializationNode(child))
  }
  return serialize(tree)
}

function supportedElement(name: string) {
  if (name === "template" || name === "svg" || name === "math") {
    throw domError("NotSupportedError", `HTML fragment does not implement ${name} element semantics`)
  }
}

function syntaxNode(node: HTMLTree.ChildNode): HTMLFragmentSyntaxNode {
  const {defaultTreeAdapter: adapter, html} = parser()
  if (adapter.isTextNode(node)) return Object.freeze({type: "text", value: node.value})
  if (adapter.isCommentNode(node)) return Object.freeze({type: "comment", value: node.data})
  if (!adapter.isElementNode(node) || node.namespaceURI !== html.NS.HTML) {
    throw domError("NotSupportedError", "HTML fragment supports only HTML elements, text and comments")
  }
  supportedElement(node.tagName)
  return Object.freeze({
    type: "element",
    name: node.tagName,
    attrs: Object.freeze(node.attrs.map(({name, value}) => Object.freeze({name, value}))),
    children: Object.freeze(node.childNodes.map(syntaxNode)),
  })
}

function materialize(document: Document, syntax: HTMLFragmentSyntaxNode): Node {
  if (syntax.type === "text") return document.createTextNode(syntax.value)
  if (syntax.type === "comment") return document.createComment(syntax.value)
  const element = document.createElement(syntax.name)
  for (const {name, value} of syntax.attrs) element.setAttribute(name, value)
  for (const child of syntax.children) element.appendChild(materialize(document, child))
  return element
}

function serializationNode(node: Node): HTMLTree.ChildNode {
  const {defaultTreeAdapter: adapter, html} = parser()
  if (node.nodeType === 3) return adapter.createTextNode(node.textContent ?? "")
  if (node.nodeType === 8) return adapter.createCommentNode(node.textContent ?? "")
  if (node.nodeType !== 1) throw domError("NotSupportedError", "HTML serialization supports only elements, text and comments")
  const element = node as Element
  supportedElement(element.localName)
  const tree = adapter.createElement(element.localName, html.NS.HTML,
    element.getAttributeNames().map(name => ({name, value: element.getAttribute(name)!})))
  for (const child of element.childNodes) adapter.appendChild(tree, serializationNode(child))
  return tree
}
