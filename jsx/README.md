[Автоматический JSX protocol](index.ts) и его самостоятельные владельцы описаны в коде и контрактах.

Публичное авторство приложения задаёт `jsxImportSource: "@zavx0z/immersive/XReact"`.
XReact — вход авторства и сборки. Compiler заменяет JSX и hooks конкретным
DOM constructor: настоящий native Element либо DOMGroup для нескольких корней.
Существующие slots, fragments и hooks сохраняют авторскую форму. Готовый JS
использует DOM primitives и собственные зависимости; Component/XReact runtime,
общий hook dispatcher и интерпретатор HostBinding не требуются.

Закон: компонент владеет существующим DOM-объектом либо диапазоном, а Document
владеет подключением, переносом, событиями и очередью задач. Hooks получают
конкретные поля этого объекта. Доказанные прямые root inputs, в том числе
`disabled={props.disabled === true}`, читают действующее native свойство.
Остальные inputs хранятся в полях owner; `style` не подменяет native CSSStyleDeclaration.
Readonly props facade меняет identity при принятом external input и сохраняет
её при hook update. Снимки предыдущих inputs принадлежат истории render/memo,
а не текущему состоянию native элемента. Явное присваивание нового input
остаётся командой; arbitrary derived expressions не обращаются автоматически.

Сессия компилирует только свои `sourceRoots`. Внешний готовый компонент
подтверждается nominal `CompiledDOMComponent`/DOM constructor в `.d.ts`, custom
hook — `CompiledHookFactory`. Слоты и транзитивные декларации участвуют в кеше;
чтение декларации не разрешает компиляцию исходников зависимости.

Сохранённый JSX в object variants сохраняет static slot name и identity
исходного компонента через native symbol declarations текущего файла. Имя
поля объекта не определяет slot; неизвестное происхождение и отдельная запись
после initializer не подтверждают конкретный child contract. Чужой authored
исходник для этого доказательства не читается.

Text, attributes/properties, events и физические ranges используют общие DOM
операции. Event binding сохраняет один listener и вызывает function handler
с `this === currentTarget`; Document владеет общей event transaction.

Для самостоятельной сборки `customConditions: []` выбирает готовые sibling
`exports.types` через штатный resolver TypeScript. Необязательный профиль
проецирует только `compilerOptions.customConditions` читаемых tsconfig JSONC,
сохраняя файлы, exports и исходники без изменений. Build-time
`createCompilerFileSystem` предоставляет ту же проекцию генератору деклараций.
Без опции сохраняется исходная конфигурация проекта. `getAuthoringDeclarations`
даёт сборке ту же классификацию components/hooks/authoring imports, что emit.

`sourceFiles` дополнительно ограничивает native root files самостоятельной
сборки точным списком файлов владельца: `files` задаётся явно, `include` и
`exclude` очищаются. Зависимости по-прежнему разрешаются только настоящими
imports и package exports. Этот профиль не разрешает компиляцию файла вне
`sourceRoots`; обычная сессия без опций сохраняет project includes.
