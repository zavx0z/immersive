import type {Document} from "../document.ts"
import type {HTMLElement} from "../html-element.ts"
import {Event} from "../event.ts"

const pending = new WeakMap<Document, Set<HTMLElement>>()

/**
Доставляет scroll после изменения состояния, вне setter и расчёта раскладки.
Повторные изменения одного элемента объединяются до следующей задачи.
Обработчик получает текущую позицию; прокрутка из обработчика создаёт новую
задачу. Отключённые элементы и элементы другого Document пропускаются.
*/
export function queueDocumentScrollEvent(document: Document, target: HTMLElement): void {
  const targets = pending.get(document)
  if (targets !== undefined) {
    targets.add(target)
    return
  }
  const batch = new Set([target])
  pending.set(document, batch)
  /** Новый scroll уже обработанного элемента остаётся для следующей задачи. */
  const flush = () => {
    try {
      for (const element of [...batch]) {
        batch.delete(element)
        if (element.ownerDocument === document && element.isConnected) {
          element.dispatchEvent(new Event("scroll"))
        }
      }
    } finally {
      if (batch.size === 0) pending.delete(document)
      else setTimeout(flush, 0)
    }
  }
  setTimeout(flush, 0)
}
