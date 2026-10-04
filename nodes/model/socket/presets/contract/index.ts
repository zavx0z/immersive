import type {ImmersiveNodesModelSocketKinds} from "@zavx0z/immersive-nodes-model-socket-kinds"
import type {ImmersiveNodesModelSocketShapes} from "@zavx0z/immersive-nodes-model-socket-shapes"

/** Именованные цветовые и геометрические предустановки сокетов. */
export declare namespace ImmersiveNodesModelSocketPresets {
  type Output = Readonly<Record<ImmersiveNodesModelSocketKinds.Output[number], Readonly<{
    kind: ImmersiveNodesModelSocketKinds.Output[number]
    label: string
    color: string
    shape: ImmersiveNodesModelSocketShapes.Output[number]
  }>>>
}
