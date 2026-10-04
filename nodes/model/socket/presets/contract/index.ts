import type {Zavx0zImmersiveNodesModelSocketKinds} from "@zavx0z/immersive-nodes-model-socket-kinds"
import type {Zavx0zImmersiveNodesModelSocketShapes} from "@zavx0z/immersive-nodes-model-socket-shapes"

/** Именованные цветовые и геометрические предустановки сокетов. */
export declare namespace Zavx0zImmersiveNodesModelSocketPresets {
  type Output = Readonly<Record<Zavx0zImmersiveNodesModelSocketKinds.Output[number], Readonly<{
    kind: Zavx0zImmersiveNodesModelSocketKinds.Output[number]
    label: string
    color: string
    shape: Zavx0zImmersiveNodesModelSocketShapes.Output[number]
  }>>>
}
