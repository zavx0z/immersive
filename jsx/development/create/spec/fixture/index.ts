/** Авторская функция не исполняется automatic protocol даже при подходящих props. */
export function authoredComponent(_props: {text: string}) {
  throw new Error("Авторская функция не должна вызываться")
}
