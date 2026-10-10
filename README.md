# Immersive

Одна визуальная платформа: DOM, пространственная сцена, интерфейс и отрисовка WebGPU.

- [Замысел и архитектурный договор](PROJECT.md).
- [Публичный DOM API и использование готового компонента](index.ts).
- [Авторинг JSX, hooks и compiler](XReact/index.ts).
- [Подключение компилятора к Bun](compiler/index.ts).
- [Публичные пути поставки](package.json).
- [Документ, элементы, диапазоны и жизненный цикл](dom/README.md).
- [JS Template и CSS](template/README.md).
- [Подключение к Canvas и ввод](browser/README.md).
- [Пространственные элементы](space/README.md).
- [UI](ui/index.ts), [модель графа](nodes/tree/README.md) и [визуальный редактор](nodes/README.md).

Сборка готовой поставки: `bun run build`. Проверка поставки без исходников
зависимостей: `bun run test:distribution`. Устройство сборки принадлежит
[producer](build.ts), контракты компонентов — их публичным входам и `contract/`,
исполняемые сценарии — соответствующим `spec/`.
