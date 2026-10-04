/**
Домен исполнения automatic JSX: создание готового значения и общий Fragment.
Native имена jsx и jsxs обозначают одну операцию компонента create.
Типовой namespace сохраняет авторский контракт владельца этой операции.

@packageDocumentation
*/
export {default as jsx, default as jsxs} from "@immersive-jsx-runtime/create"
export type {RuntimeInput, RuntimeOutput, JSX} from "@immersive-jsx-runtime/create"
export {default as Fragment} from "@immersive-jsx-runtime/fragment"
