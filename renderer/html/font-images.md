# Начертания и размеры изображений

Renderer наследует `font-family`, `font-weight` и `font-style` через semantic
дерево. Те же значения попадают в измеритель текста и text display item.
`strong`/`b` задают вес 700, `em`/`i` — italic. Перенос строк использует метрики
выбранного начертания; смена CSS пересчитывает layout без замены DOM-узлов.

WebGPU сопоставляет family, style и ближайший доступный weight с переданными
`RendererFontFace`. Измерение и retained Text используют один TrueTypeFont.
`font` остаётся обязательным базовым шрифтом для текста и fallback.

Общая подсказка HTML `title` использует этот же базовый шрифт. Browser передаёт
его `textMeasurer` в `createDocumentInteractionController` для Canvas, HUD и
Display. Ширина и переносы рассчитываются по реальному advance, включая
многоточие при ограничении высоты. Поля составляют 8 px слева и справа, 6 px
сверху и снизу; фон по умолчанию непрозрачный `#111827`, радиус — 3 px.
Подсказка остаётся внутри viewport с внешним зазором 4 px. Если места нет даже
для одной строки с полями, она не рисуется. CPU-only controller без измерителя
сохраняет приблизительные метрики; Browser всегда предоставляет метрики шрифта.
Задержка, поиск `title` у предков и подавление через `title=""` сохраняются.
Проверки: `renderer/html/tests/title-tooltip.test.ts` и
`browser/tests/projection-input.test.ts`.

Browser `createExperience` принимает `fontSources`: список `{family, weight,
style, src}`. Он загружает эти файлы через общий Engine font cache до запуска
проекций. Для уже загруженных шрифтов предусмотрен `fontFaces`; одновременно
передавать оба списка нельзя. Относительный `src` разрешается относительно
baseURI native Document приложения. Все HUD и Display одного Experience
получают один набор начертаний.

Renderer принимает необязательный `imageMeasurer.measureImage(src, signal?)`.
Он владеет отдельным AbortController для каждого измеряемого img и его текущего
src. Browser передаёт тот же signal в WebGPU `readImageSize`; отдельного декодера
нет. Смена src, удаление img или завершение Renderer отменяют только это измерение.
Same-Document reparent внутри одной проекции сохраняет signal; перенос в другую
проекцию завершает прежнее владение и создаёт новое у текущего Renderer.
Другой потребитель того же source сохраняет собственный lease. Отключённая
проекция не приобретает sizing resource заново при чтении геометрии.
После загрузки Browser инвалидирует layout соответствующей проекции и
запрашивает кадр. Изображение без заданных размеров использует естественные;
при одной заданной стороне сохраняется соотношение сторон. `max-width`
ограничивает ширину и пересчитывает автоматическую высоту.

CSS `@font-face` registry пока не реализован: приложение объявляет доступные
TTF-файлы через Experience.

GIF воспроизводится в WebGPU TextureLoader через нативный ImageDecoder.
Декодер отвечает за композицию и disposal кадров, загрузчик переиспользует одну
GPU-текстуру и запрашивает обычное представление через Browser. Длительности
кадров (минимум 10 ms) и количество повторений берутся из файла. Когда последний
материал удаляется или меняет src, таймер и декодер освобождаются. Готовые неактивные ресурсы входят в общий LRU cache с бюджетом по умолчанию
32 МиБ и 128 записей; активные leases учитываются отдельно. Вытеснение
освобождает texture/bitmap/decoder и не затрагивает активного потребителя.
При новом потребителе незавершённая анимация запускается с начала. Браузер без GIF ImageDecoder показывает статичный
кадр и сообщает об ограничении. Дополнительного Canvas или RAF нет.

WebGPU backend проверяет пересечение image box с логическим viewport и всеми
вложенными clips, включая скругления и поддерживаемые scale/translate.
Полностью скрытый image mesh исключается из рисования. Если все потребители
GIF-текстуры скрыты, декодирование приостанавливается без нового таймера;
текущий кадр, остаток задержки и число повторений сохраняются до возвращения.
Хотя бы один видимый потребитель удерживает общий GIF активным. Проверка
консервативна и не определяет перекрытие другими объектами сцены.

Подписчики, которым нужны только размеры/загрузка, получают собственный
`TextureLoader.acquire(src, callback, {animate: false})` lease. Headless освобождает
временный lease при ready, failure либо отмене ожидания кадра. Signal-bound
измерение Renderer удерживает lease до отмены владельцем img; legacy вызов без
signal освобождается после ready/failure.
Видимость retained image управляется через `setAnimationVisible` для этой же
подписки; повторный lookup текстуры не активирует скрытого потребителя.

Поведенческие проверки: `renderer/html/tests/font-image.test.ts`,
`webgpu/tests/font-faces.test.ts`, `browser/tests/projection-input.test.ts`.
Полная компонентная композиция с HTML-картинкой и относительной базой проверена
в `ui/tests/markdown.test.ts`.

GIF: `webgpu/tests/gif-animation.test.ts` проверяет задержки, повторения и
отмену незавершённого decode. `webgpu/tests/gif-texture.test.ts` проверяет путь
через реальный retained backend, переиспользование текстуры, clipping двух
потребителей и удаление img. `webgpu/tests/image-visibility.test.ts` проверяет
границы viewport, частичную видимость и вложенные скруглённые clips.
Контракт декодера: [WebCodecs ImageDecoder](https://www.w3.org/TR/webcodecs/#imagedecoder-interface).

Жизненный цикл измерений и отмена pending проверяются в
`renderer/html/tests/image-lifecycle.test.ts`; передача signal через HUD/Display —
в `browser/tests/projection-input.test.ts`. Временное ожидание Headless проверяется
в `headless/tests/texture-wait.test.ts`, а прохождение до native GPU пикселей —
в `headless/tests/image-render.test.tsx`.
