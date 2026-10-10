/**
Авторский JSX, hooks и инструменты компиляции Immersive.

Этот модуль выполняется только при разработке и сборке. Вызовы авторских
intrinsics заменяются конкретным DOM-кодом; готовый компонент не импортирует
этот модуль и не вызывает общий исполнитель hooks.

@packageDocumentation
*/
import type {Document, DOMComponentConstructor, DOMComponentContent, DOMConstruction, DOMSlotContent} from "@zavx0z/immersive-dom"
import type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

export type ComponentKey = string | number | null
export type SetStateAction<Value> = Value | ((previous: Value) => Value)
export type Dispatch<Action> = (action: Action) => void
export type StateDispatch<Value> = Dispatch<SetStateAction<Value>>
export type Reducer<State, Action> = (state: State, action: Action) => State
export type DependencyList = readonly unknown[]
export type MutableRefObject<Value> = {current: Value}
export type RefCallback<Value> = (instance: Value | null) => void | (() => void)
export type RefObject<Value> = {current: Value | null}
export type Ref<Value> = RefCallback<Value> | RefObject<Value> | null
export type EffectCallback = () => void | (() => void)
export type ExternalStoreSubscribe = (onStoreChange: () => void) => () => void
export type FunctionComponent<Props = Record<string, never>> = (props: Readonly<Props>) => JSX.Element<object>
export type FC<Props = Record<string, never>> = FunctionComponent<Props>
export type MemoComparator<Props> = (previous: Readonly<Props>, next: Readonly<Props>) => boolean

export interface Context<Value> { readonly defaultValue: Value }
export type ContextConsumer<Value> = Readonly<{context: Context<Value>}>
export type ComponentValue<Props = unknown> = DOMConstruction<Props>
type AuthoredComponent<Props> = DOMComponentConstructor<Props> | ((props: Props) => JSX.Element<object>)
type PropsOf<Component> = Component extends DOMComponentConstructor<infer Props> ? Props
  : Component extends (props: infer Props) => unknown ? Props : never


import compileOnly from "./src/compile-only.ts"

export const useState: <Value>(initialState: Value | (() => Value)) => [Value, StateDispatch<Value>] = compileOnly
export const useReducer: <State, Action, Initial = State>(reducer: Reducer<State, Action>, initialArg: Initial, initializer?: (initialArg: Initial) => State) => [State, Dispatch<Action>] = compileOnly
export const useRef: <Value>(initialValue: Value) => MutableRefObject<Value> = compileOnly
export const useMemo: <Value>(factory: () => Value, dependencies: DependencyList) => Value = compileOnly
export const useCallback: <Callback extends (...arguments_: any[]) => unknown>(callback: Callback, dependencies: DependencyList) => Callback = compileOnly
export const useContext: <Value>(context: Context<Value>) => Value = compileOnly
export const useEffect: (setup: EffectCallback, dependencies?: DependencyList) => void = compileOnly
export const useLayoutEffect: (setup: EffectCallback, dependencies?: DependencyList) => void = compileOnly
export const useInsertionEffect: (setup: EffectCallback, dependencies?: DependencyList) => void = compileOnly
export const useEffectEvent: <Callback extends (...arguments_: any[]) => unknown>(callback: Callback) => Callback = compileOnly
export const useImperativeHandle: <Value>(ref: Ref<Value> | undefined, createHandle: () => Value, dependencies?: DependencyList) => void = compileOnly
export const useId: () => string = compileOnly
export const useDebugValue: <Value>(value: Value, format?: (value: Value) => unknown) => void = compileOnly
export const useSyncExternalStore: <Snapshot>(subscribe: ExternalStoreSubscribe, getSnapshot: () => Snapshot, getServerSnapshot?: () => Snapshot) => Snapshot = compileOnly
export const useDocument: () => Document = compileOnly
export const use: (resource: unknown) => never = compileOnly
export const useActionState: (...arguments_: unknown[]) => never = compileOnly
export const useDeferredValue: (...arguments_: unknown[]) => never = compileOnly
export const useOptimistic: (...arguments_: unknown[]) => never = compileOnly
export const useTransition: (...arguments_: unknown[]) => never = compileOnly

export const createContext: <Value>(defaultValue: Value) => Context<Value> = compileOnly
export const provideContext: <Value, Props>(context: Context<Value>, value: Value, child: DOMConstruction<Props>) => DOMConstruction<Props> = compileOnly
export const component: <Props>(type: AuthoredComponent<Props>, props: Readonly<Props>, key?: string | number | null, content?: DOMComponentContent) => DOMConstruction<Props> = compileOnly
export const fixedChildren: <Value extends DOMSlotContent>(values: readonly Value[]) => readonly Value[] = compileOnly
export const normalizeChildren: <Value extends DOMSlotContent>(value: Value) => Value | null = compileOnly
export const keyedComponents: <Value extends DOMConstruction<any>>(values: readonly Value[]) => readonly Value[] = compileOnly
export const memo: <Component extends AuthoredComponent<any>>(type: Component, compare?: (previous: Readonly<PropsOf<Component>>, next: Readonly<PropsOf<Component>>) => boolean) => Component = compileOnly
export const when: <Props>(condition: unknown, type: AuthoredComponent<Props>, props: Readonly<Props>, key?: string | number | null) => DOMConstruction<Props> | null = compileOnly
export const batch: <Result>(document: Document, callback: () => Result) => Result = compileOnly

export type {JSX} from "@zavx0z/immersive-jsx-compiler-session"

export type {CompiledDOMComponent, CompiledHookFactory} from "@zavx0z/immersive-jsx-compiler-session"

export const hasSlot: (name?: string) => boolean = compileOnly
export const composeSlot: (input: {readonly content: DOMSlotContent}) => DOMSlotContent = compileOnly
