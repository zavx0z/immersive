/** Intrinsics имеют только авторский смысл; пропущенная компиляция завершается явно. */
export default function compileOnly(): never {
  throw new Error("XReact is an authoring API: compile JSX and hooks before executing this module")
}
