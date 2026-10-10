import {expect, test} from "bun:test"
import {createDocument, Event, HTMLElement, Node, parseFragment, parseFragmentSource, serializeFragment} from "../src/index.ts"

test("fragment создаёт только Nodes того же Document и декодирует HTML-текст и атрибуты", () => {
  const document = createDocument()
  const fragment = parseFragment(document, '<!--до--><P TITLE="&quot;&amp;&nbsp;" title="ignored">A &lt; B &copy; &#x1f642;</P>после')
  expect(fragment.ownerDocument).toBe(document)
  expect(fragment.isConnected).toBe(false)
  expect(fragment.childNodes.map(node => node.nodeType)).toEqual([8, 1, 3])
  const paragraph = fragment.querySelector("p")!
  expect(paragraph.ownerDocument).toBe(document)
  expect(paragraph.getAttribute("title")).toBe('"&\u00a0')
  expect(paragraph.textContent).toBe("A < B © 🙂")
  expect(document.documentElement).toBeNull()
  expect(serializeFragment(fragment)).toBe('<!--до--><p title="&quot;&amp;&nbsp;">A &lt; B © 🙂</p>после')
  const root = document.createElement("main")
  document.append(root)
  root.replaceChildren(fragment)
  expect(root.querySelector("p")).toBe(paragraph)
  expect(fragment.childNodes).toHaveLength(0)
})

test("innerHTML читает HTML без изменения identity, фокуса, обработчиков или Document version", () => {
  const document = createDocument()
  const root = document.createElement("main")
  document.append(root)
  root.innerHTML = '<button data-id="1">A &amp; B</button><input value="исходное">'
  const button = root.querySelector("button")!
  const input = root.querySelector("input")! as HTMLElement
  input.focus()
  let clicks = 0, mutations = 0
  button.addEventListener("click", () => { clicks++ })
  const version = document.version
  const stop = document.subscribeMutations(() => { mutations++ })
  expect(root.innerHTML).toBe('<button data-id="1">A &amp; B</button><input value="исходное">')
  expect(root.innerHTML).toBe(serializeFragment(root))
  expect(root.querySelector("button")).toBe(button)
  expect(document.activeElement).toBe(input)
  expect(document.version).toBe(version)
  expect(mutations).toBe(0)
  button.dispatchEvent(new Event("click"))
  expect(clicks).toBe(1)
  stop()
  root.innerHTML = null
  expect(root.childNodes).toHaveLength(0)
  expect(root.innerHTML).toBe("")
})

test("context сохраняет HTML table/select правила и обычное восстановление незакрытых тегов", () => {
  const document = createDocument()
  const table = document.createElement("table")
  table.innerHTML = "<tr><td>Первый<tr><td>Второй"
  expect(table.innerHTML).toBe("<tbody><tr><td>Первый</td></tr><tr><td>Второй</td></tr></tbody>")
  const row = document.createElement("tr")
  const cells = parseFragment(document, "<td>A<td>B", row)
  expect(cells.querySelectorAll("td")).toHaveLength(2)
  row.append(cells)
  expect(row.innerHTML).toBe("<td>A</td><td>B</td>")
  const select = document.createElement("select")
  select.innerHTML = '<option value="a">A<option value="b">B'
  expect(select.querySelectorAll("option")).toHaveLength(2)
  expect(select.innerHTML).toBe('<option value="a">A</option><option value="b">B</option>')
  const section = document.createElement("section")
  section.innerHTML = "<p>Первый<p>Второй<br>После"
  expect(section.innerHTML).toBe("<p>Первый</p><p>Второй<br>После</p>")
})

test("raw-text и RCDATA различаются; scripts и event attributes не исполняются", () => {
  const document = createDocument()
  const root = document.createElement("section")
  const key = `immersive-fragment-probe-${Date.now()}`
  Reflect.set(globalThis, key, 0)
  try {
    const script = `globalThis[${JSON.stringify(key)}]++; const value = "&amp;<b>"`
    root.innerHTML = `<script>${script}</script><style>.x::before {content:"&<"}</style><textarea>&amp;&lt;b&gt;</textarea><title>A&amp;B</title><button onclick='globalThis[${JSON.stringify(key)}]++'>Нажать</button>`
    expect(root.querySelector("script")!.textContent).toBe(script)
    expect(root.querySelector("style")!.textContent).toBe('.x::before {content:"&<"}')
    expect(root.querySelector("textarea")!.textContent).toBe("&<b>")
    expect(root.querySelector("title")!.textContent).toBe("A&B")
    root.querySelector("button")!.dispatchEvent(new Event("click"))
    expect(Reflect.get(globalThis, key)).toBe(0)
    expect(root.innerHTML).toContain(`<script>${script}</script>`)
    expect(root.innerHTML).toContain("<textarea>&amp;&lt;b&gt;</textarea>")
  } finally { Reflect.deleteProperty(globalThis, key) }
})

test("innerHTML использует registry и доставляет attr/connect/disconnect одной полной транзакцией", () => {
  const document = createDocument()
  const root = document.createElement("main")
  document.append(root)
  let constructors = 0
  const events: string[] = []
  class Panel extends HTMLElement {
    static observedAttributes = ["label"]
    constructor() {
      super()
      constructors++
    }
    attributeChangedCallback() { events.push("attribute") }
    connectedCallback() {
      events.push("connected")
      expect(this.querySelector("span")!.textContent).toBe("&")
      expect(root.querySelector("p")!.textContent).toBe("Сосед")
      this.append(this.ownerDocument!.createTextNode("Готово"))
    }
    disconnectedCallback() { events.push("disconnected") }
  }
  document.customElementRegistry.define("fragment-panel", Panel)
  const snapshots: string[] = []
  document.subscribeMutations(() => snapshots.push(root.textContent))
  root.innerHTML = '<fragment-panel label="Имя"><span>&amp;</span></fragment-panel><p>Сосед</p>'
  const panel = root.querySelector("fragment-panel")!
  expect(panel).toBeInstanceOf(Panel)
  expect(panel.ownerDocument).toBe(document)
  expect(constructors).toBe(1)
  expect(events).toEqual(["attribute", "connected"])
  expect(snapshots).toEqual(["&ГотовоСосед"])
  root.innerHTML = ""
  expect(events).toEqual(["attribute", "connected", "disconnected"])
  expect(snapshots).toEqual(["&ГотовоСосед", ""])
})

test("отсоединённый fragment подключается один раз; неизвестные custom tags позднее upgrade сохраняют identity", () => {
  const document = createDocument()
  const root = document.createElement("main")
  document.append(root)
  const fragment = parseFragment(document, '<late-fragment label="a">Текст</late-fragment>')
  const element = fragment.firstChild!
  root.append(fragment)
  let connected = 0
  class Late extends HTMLElement { connectedCallback() { connected++ } }
  document.customElementRegistry.define("late-fragment", Late)
  expect(root.firstChild).toBe(element)
  expect(element).toBeInstanceOf(Late)
  expect(element.textContent).toBe("Текст")
  expect(connected).toBe(1)
})

test("readonly syntax не создаёт Document или custom Nodes и пригоден для кэширования bindings", () => {
  const source = '<binding-host title="A&amp;B"><!--статичный-->&copy;\uE0000\uE001</binding-host>'
  const syntax = parseFragmentSource(source)
  expect(syntax).toEqual([{
    type: "element", name: "binding-host", attrs: [{name: "title", value: "A&B"}],
    children: [{type: "comment", value: "статичный"}, {type: "text", value: "©\uE0000\uE001"}],
  }])
  expect(syntax[0]).not.toBeInstanceOf(Node)
  expect(Object.isFrozen(syntax)).toBe(true)
  const element = syntax[0]!
  if (element.type !== "element") throw new Error("Ожидалась syntax element")
  expect(Object.isFrozen(element)).toBe(true)
  expect(Object.isFrozen(element.attrs)).toBe(true)
  expect(Object.isFrozen(element.attrs[0])).toBe(true)
  expect(Object.isFrozen(element.children)).toBe(true)
})

test("unsupported namespace/template и нарушение semantic child contract сохраняют прежнее дерево", () => {
  const document = createDocument()
  const root = document.createElement("main")
  const previous = document.createElement("button")
  root.append(previous)
  document.append(root)
  for (const html of ["<svg><path></path></svg>", "<math>x</math>", "<template><p>x</p></template>", "<space><div></div></space>"]) {
    expect(() => { root.innerHTML = html }).toThrow()
    expect(root.firstChild).toBe(previous)
    expect(root.childNodes).toHaveLength(1)
  }
  const other = createDocument()
  expect(() => parseFragment(document, "<p>x</p>", other.createElement("main"))).toThrow("another Document")
  expect(root.firstChild).toBe(previous)
})

test("browser DOM bundle сохраняет независимость от Template, Component и JSX", async () => {
  const result = await Bun.build({entrypoints: [`${import.meta.dir}/../src/index.ts`], target: "browser", format: "esm", metafile: true})
  expect(result.success, result.logs.map(String).join("\n")).toBe(true)
  expect(Object.keys(result.metafile!.inputs).filter(path => /(?:^|\/)(?:template|component|jsx)\//u.test(path))).toEqual([])
  expect(Object.values(result.metafile!.outputs).flatMap(output => output.imports)).toEqual([])
  const bytes = await result.outputs[0]!.text()
  const bundled = await import(`data:text/javascript;base64,${Buffer.from(bytes).toString("base64")}`) as typeof import("../src/index.ts")
  const document = bundled.createDocument()
  const element = document.createElement("main")
  element.innerHTML = "<p>A &amp; B</p>"
  expect(element.textContent).toBe("A & B")
  expect(element.innerHTML).toBe("<p>A &amp; B</p>")
})


test("textarea HTML меняет default text, сохраняя dirty value; serialization остаётся чтением", () => {
  const document = createDocument()
  const textarea = document.createElement("textarea")
  textarea.innerHTML = "Исходное &amp;"
  expect(textarea.value).toBe("Исходное &")
  textarea.value = "Пользовательское"
  textarea.innerHTML = "Новое &lt;"
  expect(textarea.defaultValue).toBe("Новое <")
  expect(textarea.value).toBe("Пользовательское")
  expect(textarea.innerHTML).toBe("Новое &lt;")
  expect(textarea.value).toBe("Пользовательское")
})



test("HTML spatial/custom nonvoid slash не заменяет явный закрывающий тег", () => {
  const document = createDocument()
  const root = document.createElement("main")
  root.innerHTML = "<custom-host/><span>Ребёнок</span>"
  expect(root.querySelector("span")!.parentElement).toBe(root.querySelector("custom-host"))
  expect(root.innerHTML).toBe("<custom-host><span>Ребёнок</span></custom-host>")
  const previous = root.firstChild
  expect(() => { root.innerHTML = "<space><viewpoint/><display></display></space>" }).toThrow()
  expect(root.firstChild).toBe(previous)
})
