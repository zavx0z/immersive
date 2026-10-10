import type {Node} from "../src/node.ts"
import type {HTMLElement} from "../src/html-element.ts"
import {isCustomElementHost} from "../src/internal/custom-elements.ts"
import {Element} from "../src/element.ts"

/** Общая принадлежность пространственного элемента; определяет допустимость его включения в Space. */
export class SpatialElement extends Element {
  get spaceChildKind(): "space" | "viewpoint" | "object" | "hud" | "resource" {
    return "resource"
  }
}

/** Custom host сохраняется в DOM, но не становится пространственным владельцем. */
export const isSpatialHost = (node: Node): node is HTMLElement => isCustomElementHost(node)

/** Читает непосредственных пространственных детей через цепочки custom hosts. */
export function spatialChildren(root: Node): readonly Node[] {
  const result: Node[] = []
  const visit = (parent: Node) => {
    for (let child = parent.firstChild; child !== null; child = child.nextSibling) {
      if (isSpatialHost(child)) visit(child)
      else result.push(child)
    }
  }
  visit(root)
  return result
}

/** Проверяет будущий состав дерева без его изменения и без второго semantic tree. */
export function spatialChildrenAfterInsertion(
  root: Node, target: Node, inserted: readonly Node[], replacing: readonly Node[],
): readonly Node[] {
  const moving = new Set(inserted)
  const removed = new Set(replacing)
  const result: Node[] = []
  const visit = (parent: Node) => {
    const children = parent === target
      ? [...parent.childNodes.filter(child => !moving.has(child) && !removed.has(child)), ...inserted]
      : parent.childNodes.filter(child => !moving.has(child))
    for (const child of children) {
      if (isSpatialHost(child)) visit(child)
      else result.push(child)
    }
  }
  visit(root)
  return result
}

/** Ближайший пространственный владелец в том же настоящем DOM. */
export function spatialParent(node: Node): Node | null {
  let parent = node.parentNode
  while (parent !== null && isSpatialHost(parent)) parent = parent.parentNode
  return parent
}
