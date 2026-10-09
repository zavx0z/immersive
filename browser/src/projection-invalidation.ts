import {Element, type MutationBatch, type Node, type StateChangeBatch} from "@zavx0z/immersive-dom"
import type {DocumentInteractionState} from "@zavx0z/immersive-renderer-html"

/** Изменения локального дерева и его наследуемого контекста проекции. */
export const mutationAffectsProjection = (batch: MutationBatch, root: Node, interactionState: DocumentInteractionState): boolean =>
  batch.records.some(record =>
    root.contains(record.target) || record.target.contains(root) ||
    record.type === "childList" && [...record.addedNodes, ...record.removedNodes].some(node =>
      node === root || node.contains(root) ||
      // Перенос focus/pointer target меняет descendant-sensitive selectors
      // предков даже при сохранении самого semantic target.
      batch.document.activeElement !== null && node.contains(batch.document.activeElement) ||
      node instanceof Element && (interactionState.isHovered(node) || interactionState.isActive(node))
    )
  )

export const stateAffectsProjection = (batch: StateChangeBatch, root: Node): boolean =>
  batch.records.some(record => root.contains(record.target) || record.target.contains(root))
