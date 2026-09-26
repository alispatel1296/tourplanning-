type SpeechRec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function RecognitionCtor() {
  const w = window as Window & {
    SpeechRecognition?: new () => SpeechRec
    webkitSpeechRecognition?: new () => SpeechRec
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function canListen() {
  return Boolean(RecognitionCtor())
}

export function listenOnce(fallback: string) {
  return new Promise<string>((resolve) => {
    const Ctor = RecognitionCtor()
    if (!Ctor) {
      window.setTimeout(() => resolve(fallback), 900)
      return
    }
    const rec = new Ctor()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    let done = false
    const finish = (text: string) => {
      if (done) return
      done = true
      try {
        rec.stop()
      } catch {
        /* already stopped */
      }
      resolve(text.trim() || fallback)
    }
    rec.onresult = (event) => finish(event.results[0]?.[0]?.transcript ?? fallback)
    rec.onerror = () => finish(fallback)
    rec.onend = () => finish(fallback)
    try {
      rec.start()
    } catch {
      finish(fallback)
    }
    window.setTimeout(() => finish(fallback), 8000)
  })
}

export function speak(text: string) {
  if (!window.speechSynthesis) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-IN'
  utterance.rate = 1
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
