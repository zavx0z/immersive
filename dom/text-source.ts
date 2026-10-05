import {Element} from "./src/element.ts"
import type {Document} from "./src/document.ts"
import type {Node} from "./src/node.ts"

type Registration = {document: WeakRef<Document>; leases: number}
const roots = new WeakMap<Element, Registration>()

/**
 * Объявляет существующий semantic Element корнем исходного текста.
 * Единственный источник — его DOM Text: строка, callback и второе дерево не создаются.
 * Авторский lib.dom ref принимается напрямую; native DOM не поддерживается.
 *
 * Регистрации независимы. Освобождение идемпотентно и не удерживает корень или Document.
 * Отключённый корень не активен; перенос в другой Document требует новой регистрации.
 * Renderer отдельно проверяет наличие корня в кадре и root-wide user-select.
 */
export function registerTextSourceRoot(root: Element | globalThis.Element): () => void {
  if (!(root instanceof Element)) throw new TypeError("Text source requires an Immersive semantic Element")
  const document = root.ownerDocument
  if (document === null) throw new TypeError("Text source root requires an owner Document")
  let registration = roots.get(root)
  if (registration === undefined || registration.document.deref() !== document) {
    registration = {document: new WeakRef(document), leases: 0}
    roots.set(root, registration)
  }
  registration.leases++
  let held: {root: WeakRef<Element>; registration: Registration} | null = {root: new WeakRef(root), registration}
  return () => {
    if (held === null) return
    const lease = held
    held = null
    lease.registration.leases--
    const element = lease.root.deref()
    if (element !== undefined && lease.registration.leases === 0 && roots.get(element) === lease.registration) roots.delete(element)
  }
}

/** Проверяет сам корень, а не его потомков; отключённые и принятые другим Document узлы не активны. */
export function isTextSourceRoot(root: Node): boolean {
  if (!(root instanceof Element) || !root.isConnected) return false
  const registration = roots.get(root)
  return registration !== undefined && registration.document.deref() === root.ownerDocument
}
