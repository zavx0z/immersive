/** Native audio IO без видимого DOM, отдельного Document или Canvas. Controls остаются у приложения. */
export type AudioPlaybackState = Readonly<{playing: boolean, currentTime: number, duration: number, error: string | null}>
export type AudioPlayback = Readonly<{play(): Promise<void>, pause(): void, seek(seconds: number): void, dispose(): void}>
export function createAudioPlayback(blob: Blob, options: Readonly<{document: Document, onChange(state: AudioPlaybackState): void}>): AudioPlayback {
  const audio = options.document.createElement("audio")
  const url = URL.createObjectURL(blob)
  let disposed = false
  let error: string | null = null
  const publish = (): void => {
    if (!disposed) options.onChange({playing: !audio.paused && !audio.ended,
      currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      duration: Number.isFinite(audio.duration) ? audio.duration : 0, error})
  }
  const failed = (): void => {error = "Не удалось воспроизвести этот аудиофайл"; publish()}
  const events = ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"]
  for (const event of events) audio.addEventListener(event, publish)
  audio.addEventListener("error", failed)
  audio.preload = "metadata"
  audio.src = url
  audio.load()
  return {
    async play() {
      if (disposed) throw new Error("Воспроизведение уже закрыто")
      error = null
      try {await audio.play()} catch (failure) {
        error = failure instanceof Error ? failure.message : String(failure)
        publish()
        throw failure
      }
      publish()
    },
    pause() {if (!disposed) audio.pause()},
    seek(seconds) {
      if (!disposed && Number.isFinite(seconds) && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(audio.duration, Math.max(0, seconds))
        publish()
      }
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const event of events) audio.removeEventListener(event, publish)
      audio.removeEventListener("error", failed)
      audio.pause()
      audio.removeAttribute("src")
      audio.load()
      URL.revokeObjectURL(url)
    },
  }
}
