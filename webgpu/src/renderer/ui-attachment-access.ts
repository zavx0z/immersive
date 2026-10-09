import {ColorPickerMaterial, ImageMaterial, Mesh, MeshBasicMaterial, RadialBackdropMaterial, RoundedRectMaterial, Text} from "@zavx0z/immersive-engine"
import type {RenderItem} from "./utils/render-list.ts"

/** Фактические записи выбранных UI pipelines; неизвестный draw сохраняет writable depth. */
export function uiAttachmentAccess(items: readonly RenderItem[]): {depthReadOnly: boolean, stencilReadOnly: boolean} {
  let depthReadOnly = true
  let stencilReadOnly = true
  for (const item of items) {
    if (item.type === "text-stencil" || item.type === "text-cover") {
      stencilReadOnly = false
      if (item.type === "text-cover" && (item.object as Text).material.depthWrite) depthReadOnly = false
      continue
    }
    if (item.type === "instanced-rounded-rect" || item.type === "instanced-stroked-path") continue
    if (item.type === "static-mesh") {
      const source = (item.object as Mesh).material
      const material = Array.isArray(source) ? source[0] : source
      if (material instanceof ImageMaterial || material instanceof RoundedRectMaterial || material instanceof MeshBasicMaterial
        || material instanceof ColorPickerMaterial || (material as RadialBackdropMaterial | undefined)?.isRadialBackdropMaterial === true) continue
    }
    depthReadOnly = false
  }
  return {depthReadOnly, stencilReadOnly}
}
