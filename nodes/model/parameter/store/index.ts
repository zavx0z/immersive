/**
Параметр хранит отдельное JSON-значение с revision и подписками.
Неизменяемые снимки сохраняют прежнее значение; равное обновление не уведомляет подписчиков.
Ошибки подписчиков собираются после фиксации изменения.

@packageDocumentation
*/
import ownNodeJsonValue, {type ImmersiveTechJsonValueOwn} from "@zavx0z/immersive-tech-json-value-own"
import ownNodeValueType, {type ImmersiveNodesModelParameterValueType} from "@zavx0z/immersive-nodes-model-parameter-value-type"
import equalNodeJsonValue from "@zavx0z/immersive-tech-json-value-equal"
import type {ImmersiveNodesModelParameterStore as Contract} from "./contract"
import type {ParameterSnapshot} from "./contract/types"
export type {ImmersiveNodesModelParameterStore} from "./contract"
type NodeJsonValue = ImmersiveTechJsonValueOwn.Input[0]
type NodeValueType = ImmersiveNodesModelParameterValueType.Output

/**
Отдельное значение одного параметра без зависимости от его визуального представления.
Данные и metadata копируются; структурно равное обновление сохраняет revision.
*/
export default class Parameter<
  T extends NodeJsonValue,
  TPresentation extends NodeJsonValue = null,
> implements Contract.Output<T, TPresentation> {
  readonly #id: string
  readonly #presentation: TPresentation
  readonly #valueType: NodeValueType | undefined
  readonly #listeners = new Set<() => void>()
  #value: T
  #revision = 0

  constructor(
    id: Contract.Input<T, TPresentation>[0],
    initialValue: Contract.Input<T, TPresentation>[1],
    presentation: TPresentation = null as TPresentation,
    valueType?: Contract.Input<T, TPresentation>[3],
  ) {
    this.#id = requireIdentifier(id, "Parameter")
    this.#value = ownNodeJsonValue(initialValue, `Parameter value: ${id}`)
    this.#presentation = ownNodeJsonValue(presentation, `Parameter presentation: ${id}`)
    this.#valueType = valueType === undefined ? undefined : ownNodeValueType(valueType, `Parameter type: ${id}`)
  }

  get id(): string {
    return this.#id
  }

  get revision(): number {
    return this.#revision
  }

  get value(): T {
    return this.#value
  }

  get presentation(): TPresentation {
    return this.#presentation
  }

  get valueType(): NodeValueType | undefined {
    return this.#valueType
  }

  set(value: T): boolean {
    const owned = ownNodeJsonValue(value, `Parameter value: ${this.#id}`)
    if (equalNodeJsonValue(this.#value, owned)) return false
    this.#value = owned
    this.#revision += 1
    const errors: unknown[] = []
    for (const listener of [...this.#listeners]) {
      try {
        listener()
      } catch (error) {
        errors.push(error)
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, `Parameter listeners failed after commit: ${this.#id}`)
    }
    return true
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener)
    let subscribed = true
    return () => {
      if (!subscribed) return
      subscribed = false
      this.#listeners.delete(listener)
    }
  }

  snapshot(): ParameterSnapshot<T, TPresentation> {
    return Object.freeze({
      id: this.#id,
      revision: this.#revision,
      value: this.#value,
      presentation: this.#presentation,
      ...(this.#valueType === undefined ? {} : {valueType: this.#valueType}),
    })
  }

  toJSON(): ParameterSnapshot<T, TPresentation> {
    return this.snapshot()
  }
}


function requireIdentifier(value: string, label: string): string {
  if (value.trim().length === 0) throw new Error(`${label} id must be non-empty`)
  return value
}
