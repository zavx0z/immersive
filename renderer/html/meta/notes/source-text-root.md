# Исходный текст и виртуализация readonly документов

Невыполненный общий механизм, выявленный при работе над производительностью чата.
Изменение Renderer HTML ещё не реализовано.

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

Предлагаемая минимальная capability: DOM регистрирует source-text root без
отдельной строки, callback или второго дерева. Его единственный источник —
собственные DOM Text. Регистрация имеет освобождение, слабое владение и проверку
ownerDocument. Renderer читает raw DOM только внутри зарегистрированного корня,
представленного в данном frame и не запрещённого root-wide user-select:none;
не добавляет там visual block LF. Внешний rendered copy сохраняет прежние правила.
Декоративный UI не входит в исходный текст такого корня.

После generic проверок CodeEditor сможет оставить visible rows с overscan,
hidden raw gaps и закреплёнными endpoints выделения. Нужны настоящий Browser
copy, точные UTF-16/CRLF, cross-block selection, scrollToLine, resize и освобождение.
Локальный перехват clipboard, обрезка документа и второе semantic дерево не подходят.
