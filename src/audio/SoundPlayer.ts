export type Sound = 'reveal' | 'tap' | 'sparkle' | 'next'
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
      this.context ??= new Constructor()
      if (this.context.state === 'suspended')
        void this.context.resume().catch(() => {})
    } catch {
      /* Optional sound. */
    }
  }
  play(sound: Sound) {
    if (this.muted || document.hidden || Date.now() - this.lastPlayed < 120)
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
  }
}
