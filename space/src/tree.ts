import type {Document, Node} from "@zavx0z/immersive-dom"
import {DisplayElement} from "@zavx0z/immersive-dom/display"
import {XRMeshElement, XRObjectElement} from "./elements.ts"
import {HUDElement} from "@zavx0z/immersive-dom/hud"
import {SpaceElement, spatialChildren, spatialParent} from "@zavx0z/immersive-dom/space"
import {ViewPointElement} from "@zavx0z/immersive-dom/viewpoint"

export type SpaceHUDProjection = Readonly<{
  element: HUDElement
  distance: number
}>

export type SpaceTree = Readonly<{
  space: SpaceElement
  viewPoint: ViewPointElement
  objects: readonly XRObjectElement[]
  meshes: readonly XRMeshElement[]
  displays: readonly DisplayElement[]
  hud: SpaceHUDProjection | null
}>

/** Читает семантических владельцев по identity Element; DOM id не является ключом сцены. */
export const readSpaceTree = (document: Document): SpaceTree => {
  const spaces = [...document.querySelectorAll("space")]
  const space = spaces[0]
  if (spaces.length !== 1 || !(space instanceof SpaceElement)) {
    throw new TypeError("Document must contain exactly one SpaceElement")
  }
  const container = spatialParent(space)
  if (container !== document && container !== document.querySelector("body")) {
    throw new TypeError("Space must be an application root in Document or body")
  }

  const children = spatialChildren(space)
  const viewPoints = children.filter(
    (child): child is ViewPointElement => child instanceof ViewPointElement,
  )
  if (viewPoints.length !== 1) {
    throw new TypeError("Space must contain exactly one ViewPoint")
  }

  const hudElements = children.filter(
    (child): child is HUDElement => child instanceof HUDElement,
  )
  const hudElement = hudElements[0] ?? null

  const objects = collectObjects(children)

  return Object.freeze({
    space,
    viewPoint: viewPoints[0]!,
    objects: Object.freeze(objects),
    meshes: Object.freeze(objects.filter(
      (element): element is XRMeshElement => element instanceof XRMeshElement,
    )),
    displays: Object.freeze(children.filter((child): child is DisplayElement => child instanceof DisplayElement)),
    hud: hudElement
      ? Object.freeze({element: hudElement, distance: hudElement.distance})
      : null,
  })
}

const collectObjects = (children: readonly Node[]): XRObjectElement[] => {
  const objects: XRObjectElement[] = []
  const visit = (element: XRObjectElement): void => {
    objects.push(element)
    for (const child of spatialChildren(element)) {
      if (child instanceof XRObjectElement) visit(child)
    }
  }
  for (const child of children) {
    if (child instanceof XRObjectElement) visit(child)
  }
  return objects
}
