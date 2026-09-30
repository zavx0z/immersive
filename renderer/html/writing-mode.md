# Вертикальные текстовые строки

`@renderer/html` рассчитывает intrinsic-размеры DOM Text для `horizontal-tb`,
`vertical-rl`, `vertical-lr`, `sideways-rl` и `sideways-lr`. Вертикальная строка
использует длину текста как высоту, а `line-height` — как ширину колонки.
Явные переводы строки создают колонки в направлении выбранного writing-mode.
`width: min-content`, `max-content` и `fit-content` используют ту же физическую
ширину вертикальных строк, включая текст во вложенных flex/inline-элементах.
Удлинение строки увеличивает её высоту; явный перевод строки добавляет ширину колонки.

`text-orientation: sideways` сохраняет строку целиком и передаёт её поворот
в список рисования. `upright` размещает графемы в em-ячейках без поворота.
`mixed` сохраняет Latin/Cyrillic runs боком, а Han, Hiragana, Katakana, Hangul
и pictographic graphemes размещает прямо. Оба свойства наследуются; смена
свойства пересчитывает текст, сохраняя semantic node identity.

`padding-inline` и `padding-block`, а также их start/end longhands, следуют
вычисленному writing-mode. Физические и логические отступы сохраняют общий
приоритет каскада. RTL direction этой частью пока не поддерживается.

В `TextDisplayItem` необязательные `orientation` и `inlineSize` описывают поворот
и измеренную длину строки. `@zavx0z/webgpu` поворачивает существующий Text вокруг
рассчитанной базовой линии, учитывает scale/clip и границы глифов при culling.
Отдельный Document, Canvas или semantic tree не создаётся.

## Граница поддержки

Для `css.properties.writing-mode` и `css.properties.text-orientation` это
частичная поддержка стандартной семантики текстовых строк. Полная вертикальная
block/flex-раскладка, переносы и фрагментация смешанных inline-элементов,
вертикальные input/textarea и выделение, bidi, полный Unicode Vertical_Orientation,
вертикальные OpenType-подстановки и комбинации символов пока не реализованы.
`mixed` использует перечисленные группы Unicode и не заявляет полное соответствие UAX #50.

Это контракт действующего владельца Immersive. Матрица отдельного checkout
`renderer/packages/core` описывает другую реализацию и этой правкой не обновляется.

## Проверки

- [CPU: intrinsic-ширина вложенного вертикального текста](tests/intrinsic-sizing.test.ts).
- [CPU: размеры, направления, наследование и изменения текста](tests/writing-mode.test.ts).
- [WebGPU: TTF-геометрия, baseline, retained identity и culling](../../webgpu/tests/writing-mode.test.ts).
- [Tab в HUD и Display](../../ui/tests/tab.test.ts).

Нормативная модель: [CSS Writing Modes Level 4](https://www.w3.org/TR/css-writing-modes-4/).
