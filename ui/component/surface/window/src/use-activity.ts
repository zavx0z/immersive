import {useLayoutEffect, useRef, useState} from "@zavx0z/immersive-component"
import {registerWindow, type WindowActivity} from "./activity.ts"

/** Связывает controlled open с независимой активностью проекции, не пересоздавая содержимое. */
export function useWindowActivity(
  area: {readonly current: HTMLDivElement | null},
  shell: {readonly current: HTMLElement | null},
  open: boolean,
): WindowActivity {
  const [state, setState] = useState<WindowActivity>({active: false, rank: 0})
  const registration = useRef<ReturnType<typeof registerWindow> | null>(null)
  useLayoutEffect(() => {
    if (!area.current || !shell.current) return
    if (registration.current && !registration.current.matches()) {
      registration.current.dispose()
      registration.current = null
    }
    if (!registration.current) {
      registration.current = registerWindow(area.current, shell.current, next => {
        setState(previous => previous.active === next.active && previous.rank === next.rank ? previous : next)
      })
      // Начальная композиция задаёт порядок, сохраняя уже выбранный keyboard focus.
      registration.current.setOpen(open, false)
    } else registration.current.setOpen(open)
  })
  useLayoutEffect(() => () => {
    registration.current?.dispose()
    registration.current = null
  }, [])
  return state
}
