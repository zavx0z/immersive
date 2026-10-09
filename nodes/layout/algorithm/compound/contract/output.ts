import type {ImmersiveNodesLayout} from "../../../contract/index.ts"

/** Абсолютные прямоугольники карточек и Frames в исходном порядке, без связей. */
export interface CompoundLayoutOutput extends ImmersiveNodesLayout.Output {
  readonly direction: "DOWN"
}
