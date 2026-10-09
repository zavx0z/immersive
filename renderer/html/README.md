# Рендерер

`@zavx0z/immersive-renderer-html` вычисляет представление семантического DOM на CPU:
CSS, размеры, раскладку, прокрутку, список рисования и данные выбора цели ввода.
Один документ служит источником для этих взаимосвязанных результатов.

## Ответственность

- Вычисление поддерживаемых CSS-свойств и геометрии содержимого.
- Измерение текста и изображений через переданные источники метрик.
- Формирование RenderFrame: боксы, clipping, display records и hit-данные.
- Прокрутка, выделение текста, положение каретки и геометрия диапазонов.
- Обновление производных данных при изменениях документа и взаимодействия.

DOM владеет элементами и их состоянием. Renderer вычисляет их представление,
WebGPU рисует результат, а Browser связывает его с Canvas и нативным вводом.
Renderer не выделяет GPU-текстуры и не создаёт отдельный цикл кадров приложения.

`backdrop-filter` поддерживает `none` и один `blur(<неотрицательное число>px)`;
нулевое значение допускается без единицы. Sigma передаётся в CSS px, включая
`blur(0)`. Остальные функции, списки фильтров, проценты и относительные единицы
не поддерживаются. Невалидная декларация не вытесняет предыдущую валидную;
`var()` разрешается общим CSS-каскадом.

Renderer выпускает отдельный `RectDisplayItem` с `key:"backdrop"` и
`backdropBlur` перед собственным фоном, рамкой и содержимым, после внешней тени.
Он сохраняет border-box, скругления, clips, transform и суммарную opacity;
прозрачный фон не исключает операцию. У обычных records поля `backdropBlur` нет.
Backend размывает уже накопленное изображение, собственный foreground рисуется
после этого. Список records остаётся плоским: отдельные CSS backdrop roots,
изоляция вложенных фильтров и групповое смешивание opacity пока не представлены.
Изменение containing block для absolute/fixed из-за `backdrop-filter` также
пока не поддерживается. [Поведенческие проверки](tests/backdrop-filter.test.ts).

## Публичный API

`createDocumentDragController` доставляет semantic drag lifecycle выбранной
общим input router цели. Контроллер сохраняет Element между проекциями того
же Document и не удерживает файловый payload.
[Контракт Browser](../../browser/drag-and-drop.md).

Основной вход — `@zavx0z/immersive-renderer-html`: `createDocumentRenderer`, типы кадров,
средства hit testing, состояния взаимодействия и работы с выделением.
`@zavx0z/immersive-renderer-html/frame-changes` предоставляет отдельный контракт изменений кадра.
Подробности аргументов и жизненного цикла находятся в исходниках этих API.

## Чтение геометрии через DOM

Renderer обслуживает `Element.getBoundingClientRect()` через document-local
поставщика геометрии. Он обновляет текущую раскладку и возвращает объединение
border-box фрагментов с учётом прокрутки и поддерживаемых CSS transforms.
Clipping, тени и прозрачность не меняют результат. Повторное чтение без
инвалидации использует уже рассчитанный кадр.

`projectClientPoint` позволяет Browser перевести углы бокса из локальных
CSS-координат проекции в viewport Canvas. Без него координаты относятся
к viewport данного Renderer. `dispose()` освобождает регистрацию.
Вспомогательный расчёт, который ничего не представляет на экране, может
использовать `registerGeometry:false`; он не заменяет активного владельца
геометрии того же root.

[Контракт DOM](../../dom/README.md#размер-и-положение-элемента) и
[поведенческие проверки](tests/bounding-client-rect.test.ts).

`translate`, `translateX` и `translateY` сохраняют отрицательные значения.
Проценты считаются от соответствующей стороны собственного border-box; порядок
переноса и `scale` сохраняется. Это изменяет client geometry, paint и hit,
сохраняя исходную layout geometry. Ограничения неотрицательных размеров
не меняются. [Проверки знака, процентов и порядка преобразований](tests/signed-translation.test.ts)
и [согласованности обновлённого кадра](tests/transform-batch.test.ts).

Совместные изменения transform родителя и атрибутов `vector-path` учитываются
в одном кадре независимо от их порядка. Смена `hidden` или `d` не теряется
за transform-only обновлением; отдельные изменения сохраняют свои быстрые пути.
[Проверки смешанной инвалидации и retained/fresh parity](tests/transform-vector-mutations.test.ts).

## Локальная геометрия и скрытое измерение

Поставщик обслуживает также `Element.getLayoutRect(relativeTo?)`: тот же
актуальный CPU layout, дробный border-box до transforms и Browser projection.
Публичный DOM скрывает устройство RenderFrame от компонентов. Наблюдение
доставляется Browser после расчёта, до GPU и после синхронизации проекций.

`visibility:hidden` сохраняет layout boxes, но исключает собственные paint/hit
records. Наследование и явный `visibility:visible` потомка соблюдаются.
Изменение текста, font CSS, author stylesheets и constraints использует текущую
систему invalidation; внешние изменяемые метрики требуют `invalidate(root)`.

[Договор и evidence](../../dom/layout-geometry.md),
[generic tests](tests/layout-rect.test.ts).

## Документация и проверки

- [CSS cursor и метаданные попаданий](cursor.md).
- [Прокрутка и обновления кадра](scrolling.md).
- [Inline-раскладка](inline-flow.md).
- [Вертикальные текстовые строки](writing-mode.md).
- [Размеры flex-строк и кэш измерений](flex-layout.md).
- [Выделение текста](text-selection.md).
- [Шрифты и изображения](font-images.md).
- [Область просмотра](viewport.md) и [фиксированное позиционирование](fixed-position.md).

Поведенческие проверки находятся в `tests`. Команда `bun run check` из
директории пакета проверяет типы и выполняет тесты.

Этот README описывает пакет целиком; отдельные модули документируются
публичным TSDoc их `index.ts`.

[Заливка vector-path](vector-fill.md) описывает CSS fill/fill-rule, ограниченную
грамматику контуров, paint/hit и generic evidence.

`readElementStyle(document, element, customPropertyNames)` читает цвет, суммарную
opacity предков и разрешённые custom properties тем же CSS-каскадом, что Display.
Функция не выполняет layout, не обходит потомков и обслуживает пространственные
материалы Browser без доступа потребителя к private Renderer state.
