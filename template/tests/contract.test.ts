import {describe, expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join} from "node:path"
import {pathToFileURL} from "node:url"
import {
  HTMLButtonElement,
  HTMLSpanElement,
  Text,
  createDocument,
  DOMGroup,
  Event,
  isDOMComponentConstructor,
} from "@zavx0z/immersive-dom"
import {compile, html} from "../index.ts"
import JsxCompilerSession from "@zavx0z/immersive-jsx-compiler-session"
import {
  bindEvent,
  bindProperty,
  bindText,
  defineCompiledTemplate,
  isCompiledTemplate,
  writeBinding,
} from "@zavx0z/immersive-template/compiled"

type InteractiveTemplateProps = Readonly<{
  disabled: boolean
  label: string
  onClick: () => void
  title: string
}>

function interactiveTemplate() {
  return defineCompiledTemplate<InteractiveTemplateProps>({
    bindingCount: 4,
    displayName: "InteractiveTemplateContract",
    mount(document) {
      const button = document.createElement("button")
      const label = document.createElement("span")
      const text = document.createTextNode("")
      button.setAttribute("data-role", "action")
      label.appendChild(text)
      button.appendChild(label)
      return {
        bindings: [
          bindProperty(button, "title"),
          bindProperty(button, "disabled"),
          bindText(text),
          bindEvent(button, "click"),
        ],
        nodes: [button],
      }
    },
    render(props, values) {
      writeBinding(values, 0, props.title)
      writeBinding(values, 1, props.disabled)
      writeBinding(values, 2, props.label)
      writeBinding(values, 3, props.onClick)
    },
  })
}

describe("Compiled Template contract", () => {
  test("[TPL-001] HTML применяет готовые DOM constructors после динамического импорта TSX output", async () => {
    const sourceRoot = await mkdtemp(join(import.meta.dir, ".compiler-contract-"))
    const sourcePath = join(sourceRoot, "greeting.tsx")
    const outputPath = join(sourceRoot, "greeting.compiled.ts")
    await Bun.write(join(sourceRoot, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        exactOptionalPropertyTypes: true,
        jsx: "preserve",
        jsxImportSource: "@zavx0z/immersive-jsx",
        lib: ["ESNext", "DOM"],
        module: "Preserve",
        moduleResolution: "bundler",
        noEmit: true,
        strict: true,
        target: "ESNext",
      },
      files: ["greeting.tsx"],
    }))
    await Bun.write(sourcePath, [
      'import {useState, useLayoutEffect} from "@zavx0z/immersive-component"',
      "export function Greeting(props: {label: string, mount: () => void, cleanup: () => void}) {",
      "  const [count, setCount] = useState(0)",
      "  useLayoutEffect(() => {props.mount(); return props.cleanup}, [])",
      "  return <button title={props.label} onClick={() => setCount(value => value + 1)}>{props.label}:{count}</button>",
      "}",
      "export function Pair() { return <><span>one</span><span>two</span></> }",
      "",
    ].join("\n"))

    const compiler = new JsxCompilerSession({cwd: sourceRoot, sourceRoots: [sourceRoot]})
    try {
      const result = await compiler.compileFile(sourcePath)
      await Bun.write(outputPath, result.code)
      const built = await Bun.build({
        entrypoints: [outputPath], target: "bun", format: "esm", metafile: true,
        plugins: [{name: "canonical-dom-owner", setup(build) {
          build.onResolve({filter: /^@zavx0z\/immersive-dom(?:\/.*)?$/}, args => ({path: Bun.resolveSync(args.path, import.meta.dir), external: true}))
        }}],
      })
      expect(built.success).toBe(true)
      expect(Object.keys(built.metafile!.inputs).filter(path => /(?:^|\/)(?:component|jsx|template)\/(?:src|dom|compiled)/.test(path))).toEqual([])
      const executablePath = join(sourceRoot, "ready.js")
      await Bun.write(executablePath, await built.outputs[0]!.text())
      const compiledModule = await import(pathToFileURL(executablePath).href)
      expect(result.code.includes("<button"), "TPL-001: output не содержит runtime JSX").toBe(false)
      expect(/from ["']@zavx0z\/immersive(?:\/XReact|-component|-template)/.test(result.code), "TPL-001: ready output зависит только на lower DOM").toBe(false)
      expect(isDOMComponentConstructor(compiledModule.Greeting)).toBe(true)
      expect(isCompiledTemplate(compiledModule.Greeting)).toBe(false)
      const document = createDocument(), host = document.createElement("main")
      document.append(host)
      let mounts = 0, cleanups = 0
      const props = {label: "one", mount: () => { mounts++ }, cleanup: () => { cleanups++ }}
      const program = compile((label: string) => html`${{type: compiledModule.Greeting, props: {...props, label}}}`)
      const instance = program.mount(host, "one")
      const button = host.querySelector("button")!
      expect(button).toBeInstanceOf(HTMLButtonElement)
      expect(host.children).toEqual([button])
      button.dispatchEvent(new Event("click"))
      expect(button.textContent).toBe("one:1")
      instance.update("two")
      expect(host.querySelector("button") === button).toBe(true)
      expect(button.textContent).toBe("two:1")
      expect([mounts, cleanups]).toEqual([1, 0])
      instance.dispose()
      expect(cleanups).toBe(1)
      const pair = new compiledModule.Pair(document, {})
      expect(pair).toBeInstanceOf(DOMGroup)
      const fragment = compile(() => html`${pair}`).mount(host, {})
      expect(host.children.map(element => element.localName)).toEqual(["span", "span"])
      expect(fragment.rootNodes).toEqual(host.children)
      fragment.dispose()
      expect(pair.nodes).toHaveLength(2)
      pair.dispose()
    } finally {
      await compiler.close()
      await rm(sourceRoot, {force: true, recursive: true})
    }
  }, 30_000)

  test("[TPL-002] Готовый шаблон сохраняет типы элементов, атрибуты, children и обработчики событий", () => {
    const document = createDocument()
    const template = interactiveTemplate()
    const mounted = template.mount(document)
    const handler = () => undefined
    const values = new Array<unknown>(template.bindingCount)
    template.render({disabled: true, label: "Запуск", onClick: handler, title: "Run"}, values)

    const button = mounted.nodes[0]
    const label = button?.firstChild
    const text = label?.firstChild
    expect(button, "TPL-002: static button type должен сохраниться в mount").toBeInstanceOf(HTMLButtonElement)
    expect(label, "TPL-002: authored child span должен сохранить exact type").toBeInstanceOf(HTMLSpanElement)
    expect(text, "TPL-002: text child должен сохранить exact Text identity").toBeInstanceOf(Text)
    expect(
      (button as HTMLButtonElement).getAttribute("data-role"),
      "TPL-002: static attribute должен сохраниться в готовом шаблоне",
    ).toBe("action")
    expect(
      mounted.bindings.map(binding => binding.kind),
      "TPL-002: готовый шаблон должен сохранить адресованные binding kinds",
    ).toEqual(["property", "property", "text", "event"])
    expect(
      mounted.bindings[0],
      "TPL-002: title binding должен указывать на exact button и property",
    ).toMatchObject({kind: "property", name: "title", target: button})
    expect(
      mounted.bindings[3],
      "TPL-002: event binding должен сохранить exact target и event type",
    ).toMatchObject({capture: false, kind: "event", target: button, type: "click"})
    expect(
      values,
      "TPL-002: render должен сохранить props в точных numeric slots",
    ).toEqual(["Run", true, "Запуск", handler])
  })

  test("[TPL-003] Формат готового шаблона не владеет Document, состоянием компонентов и их lifecycle", () => {
    const template = interactiveTemplate()
    const firstDocument = createDocument()
    const secondDocument = createDocument()
    const firstMount = template.mount(firstDocument)
    const secondMount = template.mount(secondDocument)

    expect(
      firstMount.nodes[0]?.ownerDocument,
      "TPL-003: первый mount должен использовать переданный Document",
    ).toBe(firstDocument)
    expect(
      secondMount.nodes[0]?.ownerDocument,
      "TPL-003: повторный mount должен использовать другой переданный Document",
    ).toBe(secondDocument)
    expect(
      firstMount.nodes[0] === secondMount.nodes[0],
      "TPL-003: формат не должен хранить один Document-owned Node между mounts",
    ).toBe(false)
    expect(
      Object.keys(template).sort(),
      "TPL-003: public CompiledTemplate не должен содержать state/update/unmount owner",
    ).toEqual(["bindingCount", "displayName", "mount", "render", "styleSheets"])
    expect(
      Object.isFrozen(template),
      "TPL-003: готовый шаблон должен быть immutable transport",
    ).toBe(true)
  })
})
