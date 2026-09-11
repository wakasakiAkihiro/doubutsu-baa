export type Sound = 'reveal' | 'tap' | 'sparkle' | 'next'
export type Cue = 'hide' | 'reveal'
const cuePaths: Record<Cue, string> = {
  hide: '/audio/inai-inai.wav',
  reveal: '/audio/baa.wav',
}
export const CUE_WAIT_LIMIT = 450
const notes: Record<Sound, readonly number[]> = {
  reveal: [392, 523.25, 659.25],
  tap: [440, 554.37],
  sparkle: [659.25, 783.99, 987.77],
  next: [523.25, 392],
}
/** Quiet original sine chimes. Audio is optional and never blocks play. */
export class SoundPlayer {
  private context: AudioContext | undefined
  private muted = false
  private lastPlayed = -Infinity
  private voices = new Set<OscillatorNode>()
  private files = new Map<Cue, Promise<ArrayBuffer | undefined>>()
  private buffers = new Map<Cue, Promise<AudioBuffer | undefined>>()
  private speech: AudioBufferSourceNode | undefined
  private pending: (() => void) | undefined
  private cueVersion = 0
  /** Fetch only: don't open an audio device until the first user gesture. */
  prepare() {
    for (const cue of Object.keys(cuePaths) as Cue[]) {
      if (!this.files.has(cue)) {
        this.files.set(
          cue,
          fetch(cuePaths[cue])
            .then((response) => {
              if (!response.ok) throw new Error('Voice unavailable')
              return response.arrayBuffer()
            })
            .catch(() => undefined),
        )
      }
    }
  }
  private buffer(cue: Cue, context: AudioContext) {
    this.prepare()
    if (!this.buffers.has(cue)) {
      this.buffers.set(
        cue,
        this.files.get(cue)!.then(async (bytes) => {
          if (!bytes) return undefined
          try {
            return await context.decodeAudioData(bytes.slice(0))
          } catch {
            return undefined
          }
        }),
      )
    }
    return this.buffers.get(cue)!
  }
  setMuted(value: boolean) {
    this.muted = value
    if (value) this.silence()
  }
  unlock() {
    if (this.muted) return
    try {
      const Constructor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      if (!Constructor) return
      this.context ??= new Constructor({ latencyHint: 'interactive' })
      if (this.context.state !== 'running')
        return this.context.resume().catch(() => {})
    } catch {
      /* Optional sound. */
    }
  }
  /** The visual cue and decoded audio start together; slow/failed audio never traps play. */
  playCue(cue: Cue, onStart: () => void = () => {}) {
    this.silence()
    if (this.muted || document.hidden) {
      onStart()
      return
    }
    const resumed = this.unlock()
    const context = this.context
    if (!context) {
      onStart()
      return
    }
    const version = this.cueVersion
    let finished = false
    const finish = (buffer?: AudioBuffer) => {
      if (finished) return
      finished = true
      window.clearTimeout(timeout)
      this.pending = undefined
      if (
        buffer &&
        version === this.cueVersion &&
        !this.muted &&
        !document.hidden &&
        context.state === 'running'
      ) {
        try {
          const source = context.createBufferSource()
          const gain = context.createGain()
          source.buffer = buffer
          gain.gain.value = 0.8
          source.connect(gain)
          gain.connect(context.destination)
          source.onended = () => {
            source.disconnect()
            gain.disconnect()
            if (this.speech === source) this.speech = undefined
          }
          this.speech = source
          source.start()
        } catch {
          this.speech = undefined
        }
      }
      onStart()
    }
    const timeout = window.setTimeout(() => finish(), CUE_WAIT_LIMIT)
    this.pending = () => finish()
    void Promise.all([resumed, this.buffer(cue, context)])
      .then(([, buffer]) => finish(buffer))
      .catch(() => finish())
    // Decode the other short cue while this one plays.
    void this.buffer(cue === 'hide' ? 'reveal' : 'hide', context)
  }
  play(sound: Sound) {
    if (
      this.muted ||
      document.hidden ||
      this.speech ||
      this.pending ||
      Date.now() - this.lastPlayed < 120
    )
      return
    this.unlock()
    const context = this.context
    if (!context || context.state !== 'running' || this.voices.size > 5) return
    this.lastPlayed = Date.now()
    try {
      notes[sound].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        this.voices.add(oscillator)
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        const start = context.currentTime + index * 0.095
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.035, start + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.onended = () => {
          oscillator.disconnect()
          gain.disconnect()
          this.voices.delete(oscillator)
        }
        oscillator.start(start)
        oscillator.stop(start + 0.3)
      })
    } catch {
      this.silence()
    }
  }
  silence() {
    this.cueVersion++
    this.pending?.()
    this.pending = undefined
    try {
      this.speech?.stop()
    } catch {
      /* Already stopped. */
    }
    this.speech = undefined
    for (const voice of this.voices) {
      try {
        voice.stop()
      } catch {
        /* Already stopped. */
      }
    }
    this.voices.clear()
  }
  suspend() {
    this.silence()
    try {
      void this.context?.suspend().catch(() => {})
    } catch {
      /* Optional. */
    }
  }
  dispose() {
    this.silence()
    try {
      void this.context?.close().catch(() => {})
    } catch {
      /* Optional. */
    }
    this.context = undefined
    this.buffers.clear()
  }
}
