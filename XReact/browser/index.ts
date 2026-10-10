/**
Подключение JSX-приложения к Canvas через общий lifecycle документа.
Компоненты создают содержимое; Canvas, ввод и кадры принадлежат DOM-подключению.

@packageDocumentation
*/
export {createRoot, useSpace, useFrame} from "@zavx0z/immersive-browser"
export type {Root, RootOptions, RootState, RootSize, FrameState, FrameCallback, FrameLoop} from "@zavx0z/immersive-browser"
