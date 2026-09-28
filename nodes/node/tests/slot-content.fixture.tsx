import {ParameterNode} from "@nodes/node/parameter"
import {Typography} from "@zavx0z/ui/typography"
import {parameters} from "../spec/fixture/parameters.ts"

/**
Вход воспроизведения конфликта авторского слота и projected Parameters.

@property authored - Добавляет настоящий вложенный компонент; false оставляет слот пустым.
*/
export type ParameterSlotFixtureProps = Readonly<{authored: boolean}>

/** Передаёт назначение через вложенность JSX, не обращаясь к runtime transport. */
export function ParameterSlotFixture(props: ParameterSlotFixtureProps) {
  return <ParameterNode
    id="slot-conflict"
    label="Проверка слота"
    parameters={parameters}
  >
    {props.authored ? <Typography text="Авторское содержимое" /> : null}
  </ParameterNode>
}
