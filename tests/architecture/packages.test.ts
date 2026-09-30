import {describe, test} from "bun:test"
import {join} from "node:path"
import {assertRequirement} from "../assert.ts"

const root = join(import.meta.dir, "../..")

const packages = Object.freeze([
  ["engine", "@zavx0z/engine", "Объекты сцены, геометрия, материалы, математика и анимация без WebGPU"],
  ["dom", "@zavx0z/dom", "Семантический документ, элементы, атрибуты, события, фокус и состояние полей"],
  ["template", "@zavx0z/template", "HTML, CSS и общий формат готового шаблона"],
  ["component", "@zavx0z/component", "Состояние компонентов, хуки, контекст, эффекты и освобождение ресурсов"],
  ["renderer", "@immersive/renderer", "Независимые пакеты рендеринга документов"],
  ["renderer/html", "@renderer/html", "CSS, размеры, раскладка, прокрутка, список рисования и проверка попаданий без GPU"],
  ["markdown", "@immersive/markdown", "Разбор и отображение Markdown через готовые UI-компоненты"],
  ["typedoc", "@immersive/typedoc", "Разбор TypeScript 7 и отображение документации типов"],
  ["webgpu", "@zavx0z/webgpu", "Шейдеры, буферы, текстуры, загрузка данных и рисование"],
  ["browser", "@zavx0z/browser", "Canvas, обработка изменения размеров и ввода, общий цикл кадров браузера"],
  ["space", "@zavx0z/space", "Объекты сцены, ресурсы, группы, сетки, линии, текст, свет, анимация, геометрия и материалы"],
  ["ui", "@zavx0z/ui", "Универсальные компоненты интерфейса, тема и значки"],
  ["nodes", "@immersive/nodes", "Общее представление GraphView, GraphEditor, Frame и Link"],
  ["nodes/tree", "@nodes/tree", "Живая модель NodeTree, хранилища параметров, снимки и сохранение"],
  ["nodes/layout", "@nodes/layout", "Алгоритмы расположения нод и Worker"],
  ["nodes/parameters", "@nodes/parameters", "Представления параметров нод и проекция Parameter Store"],
  ["nodes/sockets", "@nodes/sockets", "Адресуемый Socket и его визуальные предустановки"],
  ["nodes/node", "@nodes/node", "Ноды диаграмм, параметров и произвольного содержимого"],
  ["headless", "@immersive/headless", "Без браузера: нативная отрисовка компонентов в живой DOM и PNG"],
  ["devtools", "@zavx0z/devtools", "Диагностика Document, состояния элементов и результатов Renderer"],
  ["jsx", "@zavx0z/jsx", "Авторский JSX, автоматический protocol, слоты и компиляция"],
  ["jsx/runtime", "@jsx/runtime", "Автоматический JSX protocol и identity фрагментов"],
  ["jsx/runtime/fragment", "@jsx-runtime/fragment", "Единая identity группы соседних JSX-значений"],
  ["jsx/runtime/create", "@jsx-runtime/create", "Автоматический JSX protocol для подготовленных компонентов"],
  ["jsx/development", "@jsx/development", "Отладочный automatic JSX protocol"],
  ["jsx/development/create", "@jsx-development/create", "Development protocol JSX с общей Fragment identity"],
  ["jsx/slot", "@jsx/slot", "Авторство, контракты и распределение содержимого JSX-слотов"],
  ["jsx/slot/plan", "@jsx-slot/plan", "Распределение JSX содержимого по точкам вставки"],
  ["jsx/events", "@jsx/events", "Соответствие JSX event props и нативных DOM событий"],
  ["jsx/compiler", "@jsx/compiler", "Сессия компиляции, интеграция Bun и диагностика JSX"],
  ["jsx/compiler/session", "@jsx-compiler/session", "Семантическая компиляция JSX в готовые шаблоны"],
  ["jsx/compiler/bun", "@jsx-compiler/bun", "Интеграция компилятора JSX со сборкой Bun"],
  ["jsx/slot/contract", "@jsx-slot/contract", "Статическая проверка типов, наличия и количества содержимого слотов"],
  ["jsx/slot/authoring", "@jsx-slot/authoring", "Синтаксис точек вставки и назначений JSX-слотов"],
  ["jsx/compiler/error", "@jsx-compiler/error", "Ошибки компиляции JSX с исходным файлом"],
  ["jsx/slot/child", "@jsx-slot/child", "Статическое назначение условной позиции и keyed JSX expression"],
] as const)

describe("Конечный состав пакетов", () => {
  test("[PKG-000] корневое рабочее пространство называется @zavx0z/immersive", async () => {
    const manifest = await Bun.file(join(root, "package.json")).json() as Record<string, unknown>
    assertRequirement(
      manifest.name === "@zavx0z/immersive",
      "PKG-000",
      "корневой package.json должен объявлять имя @zavx0z/immersive",
    )
    const engines = manifest.engines as {bun?: string} | undefined
    assertRequirement(
      manifest.packageManager === undefined && typeof engines?.bun === "string"
        && /^\d+\.\d+\.x$/u.test(engines.bun)
        && Bun.semver.satisfies(Bun.version, engines.bun),
      "PKG-000",
      "Repo объявляет совместимую линию Bun в engines без фиксации патча и повторного packageManager",
    )
  })

  for (const [directory, name, description] of packages) {
    test(`[PKG-001] ${name} находится в корневом каталоге ${directory}`, async () => {
      const manifestPath = join(root, directory, "package.json")
      const manifest = await Bun.file(manifestPath).json() as Record<string, unknown>

      assertRequirement(
        manifest.name === name,
        "PKG-001",
        `${directory}/package.json должен объявлять имя ${name}`,
      )
      assertRequirement(
        manifest.version === "0.0.0",
        "PKG-001",
        `${name} до первого принятого выпуска должен иметь версию 0.0.0`,
      )
      assertRequirement(
        manifest.private === true,
        "PKG-001",
        `${name} не должен публиковаться до завершения архитектурной приёмки`,
      )
      assertRequirement(
        manifest.type === "module",
        "PKG-001",
        `${name} должен быть модулем ESM`,
      )
      assertRequirement(
        manifest.packageManager === undefined && manifest.engines === undefined,
        "PKG-001",
        `${name} использует среду своего Repo без повторного объявления менеджера и engines`,
      )
      assertRequirement(
        manifest.description === description,
        "PKG-001",
        `${name} должен иметь принятое описание: ${description}`,
      )
    })
  }

  test("[PKG-002] состав пакетов совпадает с принятыми владельцами без ограничения их числа", async () => {
    const actual: string[] = []
    for (const pattern of ["*", "nodes/*", "renderer/*", "jsx/*", "jsx/*/*"]) for await (const entry of new Bun.Glob(pattern).scan({cwd: root, onlyFiles: false})) {
      if (entry === "projects" || entry === "tests") continue
      if (await Bun.file(join(root, entry, "package.json")).exists()) actual.push(entry)
    }

    const expected = packages.map(([directory]) => directory).sort()
    actual.sort()
    assertRequirement(
      JSON.stringify(actual) === JSON.stringify(expected),
      "PKG-002",
      `ожидались только пакеты ${expected.join(", ")}, получены ${actual.join(", ")}`,
    )
  })

  test("[PKG-003] корневые glob охватывают каждый пакет один раз", async () => {
    const rootManifest = await Bun.file(join(root, "package.json")).json() as {workspaces: string[]}
    const include = rootManifest.workspaces.filter(pattern => !pattern.startsWith("!"))
    const exclude = rootManifest.workspaces.filter(pattern => pattern.startsWith("!")).map(pattern => new Bun.Glob(pattern.slice(1)))
    assertRequirement(include.length > 0 && include.every(pattern => pattern.includes("*")),
      "PKG-003", "Repo объявляет glob вместо перечня пакетов")
    for (const [directory] of packages) {
      const selected = include.filter(pattern => new Bun.Glob(pattern).match(directory))
      assertRequirement(selected.length === 1 && !exclude.some(pattern => pattern.match(directory) || pattern.match(`${directory}/`)),
        "PKG-003", `${directory} должен входить ровно в один положительный glob и не исключаться`)
      const manifest = await Bun.file(join(root, directory, "package.json")).json()
      assertRequirement(manifest.workspaces === undefined, "PKG-003", `${directory} не повторяет workspaces Repo`)
    }
  })


  test("[PKG-010] зависимости различают собственные пакеты Repo и внешних владельцев", async () => {
    const localNames = new Set(await Promise.all(packages.map(async ([directory]) => {
      const manifest = await Bun.file(join(root, directory, "package.json")).json() as {name: string}
      return manifest.name
    })))
    const rootManifest = await Bun.file(join(root, "package.json")).json() as {name: string}
    localNames.add(rootManifest.name)
    for (const directory of ["", ...packages.map(([directory]) => directory)]) {
      const manifest = await Bun.file(join(root, directory, "package.json")).json() as {
        name: string
        dependencies?: Readonly<Record<string, string>>
        devDependencies?: Readonly<Record<string, string>>
        optionalDependencies?: Readonly<Record<string, string>>
        peerDependencies?: Readonly<Record<string, string>>
      }
      for (const [dependency, version] of Object.entries({
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.optionalDependencies,
      })) {
        const local = localNames.has(dependency)
        assertRequirement(
          local ? version === "workspace:*" : version.startsWith("^"),
          "PKG-010",
          `${manifest.name}: ${dependency} ${local ? "принадлежит Repo и подключается через workspace:*" : "имеет внешнего владельца и объявляет диапазон с ^"}, получено ${version}`,
        )
      }
      for (const [dependency, version] of Object.entries(manifest.peerDependencies ?? {})) {
        const local = localNames.has(dependency)
        assertRequirement(
          local ? version === "workspace:*" : !version.startsWith("workspace:") && !version.startsWith("link:"),
          "PKG-010",
          `${manifest.name}: peer dependency ${dependency} ${local ? "принадлежит Repo и использует workspace:*" : "выражает совместимость с внешним окружением обычным диапазоном версий"}`,
        )
      }
    }
  })
})
