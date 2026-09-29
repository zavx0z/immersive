import {expect, test} from "bun:test"
import {mkdtemp, rm} from "node:fs/promises"
import {join, resolve} from "node:path"
import {pathToFileURL} from "node:url"
import {createDocument, HTMLButtonElement, MouseEvent} from "@zavx0z/dom"
import {createRoot} from "@zavx0z/component"
import JsxCompilerSession from "@jsx-compiler/session"

/** Проверяет общий путь компиляции и lifecycle, не подменяя размещение ручным DOM. */
test("слоты: размещение, forwarding, fallback, keyed identity и cleanup", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".compiled-"))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [import.meta.dir]})
  const document = createDocument()
  const host = document.createElement("div")
  document.append(host)
  const root = createRoot(host)
  try {
    const compiled = await compiler.compileFile(join(import.meta.dir, "composition.fixture.tsx"))
    expect(compiled.code).not.toContain('createElement("slot")')
    expect(compiled.capabilityUsages.filter(usage => usage.kind === "intrinsic-element" && usage.tagName === "slot").every(usage => usage.kind === "intrinsic-element" && usage.profile === "template-extension")).toBeTrue()
    expect(compiled.capabilityUsages.some(usage => usage.kind === "intrinsic-attribute" && usage.tagName === "slot")).toBeFalse()
    await Bun.write(join(directory, "compiled.ts"), compiled.code)
    const module = await import(pathToFileURL(join(directory, "compiled.ts")).href)
    root.render(module.MissingChild, {})
    expect(host.querySelector("header")?.textContent).toBe("Пусто")
    root.render(module.EmptyElement, {})
    expect(host.querySelector("div")!.childNodes).toHaveLength(0)
    root.render(module.ShadowedUndefined, {label: "Текст"})
    expect(host.textContent).toBe("Текст")
    const disposed: string[] = []
    const onDispose = (id: string) => { disposed.push(id) }
    root.render(module.SlotsDemo, {title: "Первый", rows: [{id: "a", label: "A"}, {id: "b", label: "B"}], showFooter: true, onDispose})
    const header = host.querySelector('header button')!
    const first = host.querySelector('[data-counter="a"]')!
    const second = host.querySelector('[data-counter="b"]')!
    expect(first).toBeInstanceOf(HTMLButtonElement)
    if (!(first instanceof HTMLButtonElement)) throw new Error("Expected a semantic button")
    first.dispatchEvent(new MouseEvent("click", {bubbles: true}))
    first.focus()
    expect(first.textContent).toBe("A:1")
    expect(host.querySelectorAll("slot")).toHaveLength(0)
    expect(host.querySelectorAll("[slot]")).toHaveLength(0)
    expect(host.querySelector("footer button")?.textContent).toBe("Действие:0")
    expect(() => root.render(module.SlotsDemo, {
      title: "Недопустимое обновление",
      rows: [{id: "a", label: "Ошибка"}, {id: "a", label: "Повтор"}],
      showFooter: true,
      onDispose,
    })).toThrow("Duplicate keyed component")
    expect([...host.querySelector("main")!.children]).toEqual([first, second])
    expect(first.textContent).toBe("A:1")
    expect(disposed).toEqual([])
    root.render(module.SlotsDemo, {title: "Второй", rows: [{id: "b", label: "B2"}, {id: "a", label: "A2"}], showFooter: false, onDispose})
    expect(host.querySelector("header button")).toBe(header)
    expect(header.textContent).toBe("Второй:0")
    expect([...host.querySelector("main")!.children]).toEqual([second, first])
    expect(first.textContent).toBe("A2:1")
    expect(document.activeElement).toBe(first)
    expect(host.querySelector("footer [data-fallback]")?.textContent).toBe("Пусто")
    expect(disposed).toEqual(["footer"])
    root.render(module.ZeroSlot, {})
    expect(host.textContent).toBe("0")
    root.render(module.MemoSlots, {text: "До"})
    const article = host.querySelector("article")
    root.render(module.MemoSlots, {text: "После"})
    expect(host.querySelector("article")).toBe(article)
    expect(article?.textContent).toBe("После")
    const evaluated: string[] = []
    root.render(module.EvaluationOrder, {
      record(name: string) {
        evaluated.push(name)
        return name
      },
      onDispose() {},
    })
    expect(evaluated).toEqual(["footer", "header"])
    root.unmount()
    root.unmount()
    expect(disposed.sort()).toEqual(["a", "b", "footer", "header"])
  } finally {
    root.unmount()
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 60_000)

test("контракт импортированного memo-получателя инвалидирует кеш после rename", async () => {
  const directory = await mkdtemp(join(import.meta.dir, ".imports-"))
  await Bun.write(join(directory, "tsconfig.json"), JSON.stringify({extends: "../../../../../tsconfig.json", include: ["*.tsx"]}))
  const compiler = new JsxCompilerSession({cwd: resolve(import.meta.dir, "../../../.."), sourceRoots: [directory]})
  const receiver = join(directory, "panel.tsx")
  const caller = join(directory, "caller.tsx")
  const source = (name: string) => `import {memo} from "@zavx0z/component"\nfunction Panel() { return <slot name="${name}" /> }\nexport const MemoPanel = memo(Panel)`
  try {
    await Bun.write(receiver, source("header"))
    await Bun.write(caller, 'import {MemoPanel} from "./panel"\nfunction Child() { return <b /> }\nexport function App() { return <MemoPanel><Child slot="header" /></MemoPanel> }')
    await compiler.prepareFiles([receiver, caller])
    const compiled = await compiler.compileFile(caller)
    expect(compiled.code).toContain('["header"]')
    expect(await compiler.compileFile(caller)).toBe(compiled)
    await Bun.write(receiver, source("toolbar"))
    const failure = await compiler.compileFile(caller).then(
      () => null,
      (error: unknown) => error,
    )
    expect(failure).toBeInstanceOf(Error)
    expect(failure instanceof Error ? failure.message : undefined).toContain('unknown slot "header"')
  } finally {
    await compiler.close()
    await rm(directory, {recursive: true, force: true})
  }
}, 60_000)
