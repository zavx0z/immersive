/**
Базовый корень пространственной сцены одного Document.

@packageDocumentation
*/
import type {Document} from "../src/document.ts"
import type {Node} from "../src/node.ts"
import {isHTMLWhitespace, isHTMLWhitespaceNode} from "../src/internal/html-whitespace.ts"
import {Comment} from "../src/comment.ts"
import {DisplayElement} from "../display/index.ts"
import {SpatialElement, spatialChildrenAfterInsertion} from "./spatial-element.ts"

export {SpatialElement, isSpatialHost, spatialChildren, spatialChildrenAfterInsertion, spatialParent} from "./spatial-element.ts"

/**
Корень пространственной сцены; допустимость детей проверяется до изменения дерева.

@property frameloop - Режим общего цикла кадров: `demand` по изменениям, `always` непрерывно.
По умолчанию `demand`; другие значения вызывают `TypeError`.

@property background - Цвет фона сцены, по умолчанию `#000000`.
*/
export class SpaceElement extends SpatialElement {
  override get spaceChildKind(): "space" { return "space" }

  get frameloop(): "demand" | "always" {
    const value = this.getAttribute("frameloop") ?? "demand"
    if (value !== "demand" && value !== "always") throw new TypeError("Space frameloop must be demand or always")
    return value
  }
  set frameloop(value: "demand" | "always") {
    if (value !== "demand" && value !== "always") throw new TypeError("Space frameloop must be demand or always")
    this.setAttribute("frameloop", value)
  }

  constructor(ownerDocument: Document) {
    super(ownerDocument, "space")
  }

  get background(): string { return this.getAttribute("background") ?? "#000000" }
  set background(value: string) { this.setAttribute("background", value) }

  protected override validateChildInsertion(
    nodes: readonly Node[],
    replacing: readonly Node[],
  ): void {
    this.validateSpatialChildren(spatialChildrenAfterInsertion(this, this, nodes, replacing))
  }

  protected override validateDescendantInsertion(target: Node, nodes: readonly Node[], replacing: readonly Node[]): void {
    this.validateSpatialChildren(spatialChildrenAfterInsertion(this, target, nodes, replacing))
  }

  protected override validateDescendantTextChange(_target: Node, value: string): void {
    if (!isHTMLWhitespace(value)) throw new TypeError("Space accepts only whitespace text outside Display or HUD")
  }

  private validateSpatialChildren(children: readonly Node[]): void {
    for (const child of children) {
      if (child instanceof Comment || child instanceof DisplayElement || isHTMLWhitespaceNode(child)) continue
      if (!(child instanceof SpatialElement)) {
        throw new TypeError("Space accepts only spatial elements")
      }
      if (!["viewpoint", "object", "hud"].includes(child.spaceChildKind)) {
        throw new TypeError(`Space does not accept ${child.localName}`)
      }
    }

    if (children.filter(child => child instanceof SpatialElement && child.spaceChildKind === "viewpoint").length > 1) {
      throw new TypeError("Space accepts exactly one ViewPoint")
    }
    if (children.filter(child => child instanceof SpatialElement && child.spaceChildKind === "hud").length > 1) {
      throw new TypeError("Space accepts at most one HUD")
    }
  }
}
