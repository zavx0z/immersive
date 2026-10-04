import type {ImmersiveNodesModelSocketKinds} from "@immersive-nodes-model-socket/kinds"
import type {ImmersiveNodesModelSocketPresets} from "@immersive-nodes-model-socket/presets"

/** Выбирает предустановку известного вида сокета. */
export declare namespace ImmersiveNodesModelSocketPreset {
  type Input = ImmersiveNodesModelSocketKinds.Output[number]
  type Output = ImmersiveNodesModelSocketPresets.Output[Input]
}
