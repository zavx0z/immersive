/**
Состояние, композиция и исполнение готовых компонентов поверх DOM Immersive.

Компонентный корень использует переданный DOM-контейнер. Автономный DOM-элемент
и прямое монтирование исполняют один и тот же готовый компонент и разделяют
планировщик его Document. JSX-компилятор не входит в этот runtime.

@packageDocumentation
*/
export * from "@zavx0z/immersive-component"
export {useSpace, useFrame} from "@zavx0z/immersive-browser"
export type {RootState, RootSize, FrameState, FrameCallback, FrameLoop} from "@zavx0z/immersive-browser"
export type {JSX} from "@zavx0z/immersive-jsx-compiler-session"
