# Исходный текст и виртуализация readonly документов

Общий механизм, выявленный при работе над производительностью чата.
DOM registration и Renderer serialization реализованы и проверены generic тестами.
Виртуализация конкретного компонента проверяется отдельно.

`readRenderedSelectionText` пропускает Text без записи в displayList/boxes и
добавляет LF при смене rendered block. Поэтому простые hidden prefix/suffix
не сохраняют Browser clipboard, хотя DOM text-position и Range.toString
учитывают весь исходник. Нулевой размер шрифта не является заменой: эксперимент
на 13 тысячах строк создал 26 тысяч display items и занял около 1,4 секунды CPU.
Визуальные softBreaks также добавляют отсутствующие в source LF.

[Воспроизведение копирования многострочного JSON](../../../../ui/component/view/code-editor/meta/research/2026-10-05/formatted-copy.json)
использует production visual rows и эквивалентную структуру CodeLine, настоящий
Browser ClipboardController с Renderer reader и fake OS access. Без softBreaks
значения JSON сохраняются, но между строками появляются лишние whitespace.
Проверка exact source не проходит; её нельзя считать успешной или ослаблять.

Реализованная минимальная capability: DOM регистрирует source-text root без
отдельной строки, callback или второго дерева. Его единственный источник —
собственные DOM Text. Регистрация имеет освобождение, слабое владение и проверку
ownerDocument. Renderer читает raw DOM только внутри зарегистрированного корня,
представленного в данном frame и не запрещённого root-wide user-select:none;
не добавляет там visual block LF. Внешний rendered copy сохраняет прежние правила.
Декоративный UI не входит в исходный текст такого корня.

После generic проверок CodeEditor может оставить visible rows с overscan,
hidden raw gaps и закреплёнными endpoints выделения. Нужны настоящий Browser
copy, точные UTF-16/CRLF, cross-block selection, scrollToLine, resize и освобождение.
Локальный перехват clipboard, обрезка документа и второе semantic дерево не подходят.


Публичный договор: [DOM selection](../../../../dom/selection.md#корень-исходного-текста)
и [Renderer selection](../../text-selection.md#исходный-текст-зарегистрированного-корня).
Проверки владельцев: `dom/tests/text-source.test.ts`,
`renderer/html/tests/text-source.test.ts`, `browser/tests/text-source-clipboard.test.ts`.
Engine и WebGPU не изменены; source root не добавляет невидимые display items.
