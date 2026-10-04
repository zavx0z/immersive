import type {ImmersiveNodesModelSocketShapes} from "@immersive-nodes-model-socket/shapes"

/** Сохраняет известную форму сокета, оставляя неизвестную неопределённой. */
export declare namespace ImmersiveNodesModelSocketResolveShape {
  type Input = string
  type Output = ImmersiveNodesModelSocketShapes.Output[number] | undefined
}
