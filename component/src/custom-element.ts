import {Element, HTMLElement, type Node} from "@zavx0z/immersive-dom"
import {isCompiledTemplate, type CompiledTemplate} from "@zavx0z/immersive-template/compiled"
import {createRoot, type ComponentRoot} from "./runtime.ts"
import type {FunctionComponent} from "./composition.ts"
import {retainComponentContent, withComponentContent, type ComponentContent} from "./content.ts"

const emptyContent: ComponentContent = Object.freeze({})

function initialDomContent(nodes: readonly Node[]): ComponentContent {
  const groups: Record<string, Node[]> = Object.create(null)
  for (const node of nodes) {
    const name = node instanceof Element ? node.getAttribute("slot") ?? "" : ""
    const group = groups[name] ?? (groups[name] = [])
    group.push(node)
  }
  return groups
}

export type ComponentElement<Props extends object> = HTMLElement & {
  props: Readonly<Props>
  content: ComponentContent
}

export type ComponentElementConstructor<Props extends object> = new () => ComponentElement<Props>

export type ComponentElementOptions<Props extends object> = Readonly<{
  initialProps?: Readonly<Props>
  initialContent?: ComponentContent
  /** Преобразование строковых DOM-атрибутов принадлежит публичному протоколу компонента. */
  attributes?: Readonly<Partial<Record<keyof Props & string, (value: string | null) => unknown>>>
}>

/**
Предоставляет готовый компонент как автономный DOM-элемент.

Один constructor регистрируется через CustomElementRegistry. Экземпляры
используют существующий ComponentRoot и общий планировщик своего Document;
адаптер не создаёт Canvas, Renderer, второе дерево или собственный цикл кадров.
Свойства props и content передают типизированный ввод; пустой ключ content
обозначает default, остальные ключи — действующие имена slots. При первом
подключении исходные childNodes без явного content однократно распределяются
по атрибуту slot. Узлы не копируются и остаются в одном обычном DOM-дереве.
DOM-атрибуты при наличии декодеров используют тот же путь обновления.
Сеттеры принимают новый ввод после успешного render; исправленный ввод разрешает
retry первоначального подключения. Перенос и удаление следуют lifecycle элемента.

Сценарий: [исполнение одного компонента через DOM](../tests/custom-element.test.ts).
*/
export function componentElement<Props extends object>(
  template: CompiledTemplate<Props> | FunctionComponent<Props>,
  options: ComponentElementOptions<Props> = {},
): ComponentElementConstructor<Props> {
  if (!isCompiledTemplate(template)) throw new TypeError("componentElement requires a compiled component")
  const compiled = template as CompiledTemplate<Props>
  const attributes = Object.entries(options.attributes ?? {}) as [keyof Props & string, (value: string | null) => unknown][]
  for (const [name, decode] of attributes) {
    if (name !== name.toLowerCase() || typeof decode !== "function")
      throw new TypeError("Component attribute names must be lowercase and have a decoder")
  }
  const decoders = new Map(attributes)

  return class CompiledElement extends HTMLElement {
    static observedAttributes = [...decoders.keys()]
    private componentRoot: ComponentRoot | null = null
    private currentProps: Readonly<Props> = options.initialProps ?? Object.freeze({}) as Readonly<Props>
    private currentContent: ComponentContent | undefined = options.initialContent === undefined ? undefined : retainComponentContent(options.initialContent)
    private capturedContent = false

    get props(): Readonly<Props> { return this.currentProps }

    set props(value: Readonly<Props>) {
      if (value === null || typeof value !== "object") throw new TypeError("Component props must be an object")
      if (Object.is(value, this.currentProps) && this.componentRoot !== null) return
      if (this.currentContent === undefined && this.componentRoot !== null) this.componentRoot.render(compiled, value)
      else this.renderComponent(value, this.currentContent)
      this.currentProps = value
    }

    get content(): ComponentContent { return this.currentContent ?? emptyContent }

    set content(value: ComponentContent) {
      if (Object.is(value, this.currentContent) && this.componentRoot !== null) return
      withComponentContent(compiled, this.currentProps, value, this.ownerDocument!, this)
      const next = retainComponentContent(value)
      this.renderComponent(this.currentProps, next)
      this.currentContent = next
    }

    connectedCallback(): void {
      if (!this.isConnected || this.componentRoot !== null) return
      this.renderComponent()
    }

    disconnectedCallback(): void {
      // При атомарном same-Document reparent callbacks видят уже подключённый Element.
      if (this.isConnected) return
      this.disposeComponent()
    }

    adoptedCallback(): void { this.disposeComponent() }

    attributeChangedCallback(name: keyof Props & string, _previous: string | null, next: string | null): void {
      const decode = decoders.get(name)
      if (!decode) return
      const value = decode(next)
      if (Object.is(this.currentProps[name], value)) return
      this.props = {...this.currentProps, [name]: value}
    }

    private disposeComponent(): void {
      const root = this.componentRoot
      this.componentRoot = null
      root?.unmount()
    }

    private renderComponent(props = this.currentProps, content = this.currentContent): void {
      const existing = this.componentRoot
      if (existing) {
        if (content === undefined) existing.render(compiled, props)
        else existing.render(compiled, props, {content})
        return
      }
      if (!this.isConnected) return
      const nodes = [...this.childNodes]
      let accepted = content
      if (!this.capturedContent && nodes.length > 0) {
        if (content !== undefined) throw new Error("Component initial DOM children and explicit content cannot be combined")
        const captured = initialDomContent(nodes)
        withComponentContent(compiled, props, captured, this.ownerDocument!, this)
        accepted = retainComponentContent(captured)
      }
      const root = createRoot(this)
      this.componentRoot = root
      try {
        this.ownerDocument!.transaction(() => {
          try {
            if (accepted === undefined) root.render(compiled, props)
            else root.render(compiled, props, {content: accepted})
          } catch (error) {
            try { root.unmount() } finally { this.replaceChildren(...nodes) }
            throw error
          }
        })
      } catch (error) {
        this.componentRoot = null
        throw error
      }
      this.currentContent = accepted
      this.capturedContent = true
    }
  }
}
