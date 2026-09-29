/**
Домен отладочного automatic JSX: metadata вызова и общий Fragment исполнения.
Создание значения принадлежит компоненту create; Fragment импортируется у
единственного владельца в runtime, без второй реализации символа.

@packageDocumentation
*/
export {default as jsxDEV} from "@jsx-development/create"
export type {DevelopmentInput, DevelopmentOutput, JSX} from "@jsx-development/create"
export {default as Fragment} from "@jsx-runtime/fragment"
