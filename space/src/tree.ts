import type {Document} from "@immersive/dom"
import {DisplayElement} from "@immersive/dom/display"
import {XRMeshElement, XRObjectElement} from "./elements.ts"
import {HUDElement} from "@immersive/dom/hud"
import {SpaceElement} from "@immersive/dom/space"
import {ViewPointElement} from "@immersive/dom/viewpoint"

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
  const container = space.parentNode
  if (container !== document && container !== document.querySelector("body")) {
    throw new TypeError("Space must be an application root in Document or body")
  }

  const viewPoints = space.children.filter(
    (child): child is ViewPointElement => child instanceof ViewPointElement,
  )
  if (viewPoints.length !== 1) {
    throw new TypeError("Space must contain exactly one ViewPoint")
  }

  const hudElements = space.children.filter(
    (child): child is HUDElement => child instanceof HUDElement,
  )
  const hudElement = hudElements[0] ?? null

  const objects = collectObjects(space)

  return Object.freeze({
    space,
    viewPoint: viewPoints[0]!,
    objects: Object.freeze(objects),
    meshes: Object.freeze(objects.filter(
      (element): element is XRMeshElement => element instanceof XRMeshElement,
    )),
    displays: Object.freeze(space.children.filter((child): child is DisplayElement => child instanceof DisplayElement)),
    hud: hudElement
      ? Object.freeze({element: hudElement, distance: hudElement.distance})
      : null,
  })
}

const collectObjects = (root: SpaceElement): XRObjectElement[] => {
  const objects: XRObjectElement[] = []
  const visit = (element: XRObjectElement): void => {
    objects.push(element)
    for (const child of element.children) {
      if (child instanceof XRObjectElement) visit(child)
    }
  }
  for (const child of root.children) {
    if (child instanceof XRObjectElement) visit(child)
  }
  return objects
}
