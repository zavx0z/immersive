/** Состояние одного окна в общем слое его HUD или Display. */
export interface WindowActivity {
  readonly active: boolean
  readonly rank: number
}

interface Entry {
  readonly shell: HTMLElement
  readonly publish: (state: WindowActivity) => void
  open: boolean
  focus: HTMLElement | null
}

interface Layer {
  readonly parent: Element
  readonly entries: Entry[]
  active: Entry | null
}

const layers = new WeakMap<Element, Layer>()

/** Ближайшая фактическая проекция, независимо от её id. */
function projection(element: Element): Element | null {
  for (let current: Element | null = element; current; current = current.parentElement) {
    if (current.localName === "hud" || current.localName === "display") return current
  }
  return null
}

/** Публикует ограниченные числом окон CSS-ранги, без изменения DOM и component regions. */
function publish(layer: Layer): void {
  let rank = 0
  for (const entry of layer.entries) {
    entry.publish({active: entry === layer.active, rank: entry.open ? ++rank : 0})
  }
}

/** Возвращает сохранённый доступный фокус; при удалённом или скрытом поле выбирает оболочку. */
function restore(entry: Entry): void {
  const previous = entry.focus
  if (previous && entry.shell.contains(previous)
    && !["[hidden]", "[inert]", "[disabled]", '[aria-disabled="true"]'].some(selector => previous.closest(selector))) {
    // Авторский focus handler может перенаправить focus, в том числе обратно
    // в прежнюю проекцию или в null. Успешный focus не переопределяем оболочкой.
    let accepted = false
    const focused = (event: Event) => { if (event.target === previous) accepted = true }
    entry.shell.addEventListener("focus", focused, true)
    try { previous.focus() }
    finally { entry.shell.removeEventListener("focus", focused, true) }
    if (accepted) return
  }
  entry.shell.focus()
}

/** Определяет, принадлежит ли текущий keyboard focus закрываемой проекции. */
function ownsFocus(owner: Element, layer: Layer, shell: HTMLElement): boolean {
  const focused = shell.ownerDocument.activeElement
  if (!focused) return false
  return projection(focused) === owner || (projection(owner) !== owner && layer.parent.contains(focused))
}

/**
Регистрирует оболочку среди соседних Window одного HUD или Display.
Один общий родитель содержит целые оболочки; отдельные внешние wrappers запрещены,
поскольку их stacking contexts не позволяют чередовать окна по общей активности.
Без проекции родитель служит изолированной областью, в том числе в Headless.
*/
export function registerWindow(area: HTMLElement, shell: HTMLElement, notify: (state: WindowActivity) => void) {
  // Явный content attribute разрешает программный focus, сохраняя исключение из Tab.
  shell.setAttribute("tabindex", "-1")
  const parent = area.parentElement
  if (!parent) throw new Error("Window requires a mounted placement layer")
  const owner = projection(area) ?? parent
  let layer = layers.get(owner)
  if (layer && layer.parent !== parent) {
    throw new Error("Windows of one HUD or Display must share one parent placement layer; move whole windows out of individual wrappers")
  }
  if (!layer) {
    layer = {parent, entries: [], active: null}
    layers.set(owner, layer)
  }
  const state = layer
  const entry: Entry = {shell, publish: notify, open: false, focus: null}
  state.entries.push(entry)
  let disposed = false
  let hadFocus = false
  const ownsKeyboardFocus = () => ownsFocus(owner, state, shell) || (shell.ownerDocument.activeElement === null && hadFocus)

  const activate = (focus: boolean) => {
    if (disposed || !entry.open || !shell.isConnected) return
    if (state.active !== entry || state.entries.at(-1) !== entry) {
      state.entries.splice(state.entries.indexOf(entry), 1)
      state.entries.push(entry)
      state.active = entry
      publish(state)
    }
    if (focus) restore(entry)
  }
  const deactivate = (focus: boolean) => {
    if (state.active !== entry) return
    state.active = state.entries.findLast(candidate => candidate !== entry && candidate.open && candidate.shell.isConnected) ?? null
    publish(state)
    if (focus) {
      if (state.active) restore(state.active)
      else {
        const focused = shell.ownerDocument.activeElement as HTMLElement | null
        if (focused && shell.contains(focused)) focused.blur()
      }
    }
  }
  const pointer = () => activate(false)
  const focused = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (target && shell.contains(target)) {
      // Кнопка сворачивания не заменяет последнее место работы в содержимом.
      if (target.closest("button")?.getAttribute("aria-controls") !== shell.id) entry.focus = target
      hadFocus = true
    }
    activate(false)
  }
  const blurred = (event: Event) => {
    const next = (event as FocusEvent).relatedTarget as Node | null
    if (!next || !shell.contains(next)) hadFocus = false
  }
  shell.addEventListener("focusout", blurred, true)
  shell.addEventListener("pointerdown", pointer, true)
  shell.addEventListener("focusin", focused, true)

  return {
    /** Открытие поднимает окно, скрытие выбирает предыдущее видимое только в той же проекции. */
    setOpen(open: boolean, focus = true) {
      if (disposed || open === entry.open) return
      entry.open = open
      if (open) activate(focus)
      else {
        deactivate(ownsKeyboardFocus())
        publish(state)
      }
    },
    /** Проверяет фактического родителя при следующем component update. */
    matches() { return area.parentElement === parent && (projection(area) ?? parent) === owner },
    /** Удаляет listeners и регистрацию, не удаляя принадлежащий Component DOM. */
    dispose() {
      if (disposed) return
      disposed = true
      const focus = ownsKeyboardFocus()
      entry.open = false
      shell.removeEventListener("pointerdown", pointer, true)
      shell.removeEventListener("focusin", focused, true)
      shell.removeEventListener("focusout", blurred, true)
      state.entries.splice(state.entries.indexOf(entry), 1)
      deactivate(focus)
      publish(state)
      if (state.entries.length === 0) layers.delete(owner)
    },
  }
}
