/** Intrinsics авторства общего Browser подключения; compiler заменяет их прямым DOM-кодом. @packageDocumentation */
import type {RootState, FrameCallback} from "./src/document-environment.ts"
const compileOnly = (): never => { throw new Error("Compile Browser hooks before executing the component") }
export const useSpace: <Selection>(selector: (state: RootState) => Selection) => Selection = compileOnly
export const useFrame: (callback: FrameCallback) => void = compileOnly
export type {RootState, RootSize, FrameState, FrameCallback, FrameLoop} from "./src/document-environment.ts"
