import type {Zavx0zImmersiveNodesModelSocketKinds} from "@zavx0z/immersive-nodes-model-socket-kinds"
import type {Zavx0zImmersiveNodesModelSocketPresets} from "@zavx0z/immersive-nodes-model-socket-presets"

/** Выбирает предустановку известного вида сокета. */
export declare namespace Zavx0zImmersiveNodesModelSocketPreset {
  type Input = Zavx0zImmersiveNodesModelSocketKinds.Output[number]
  type Output = Zavx0zImmersiveNodesModelSocketPresets.Output[Input]
}
