/**
 * Procedural Medical Audio Synthesizer for MedAtlas3D
 * Generates realistic cardiac cycle rhythms and respiratory breath sounds
 * directly via the Web Audio API without needing external audio files.
 */

class MedicalSoundEngine {
  constructor() {
    this.ctx = null
    this.masterGain = null
    this.isPlaying = false
    this.activeOrgan = 'heart'
    this.bpm = 72
    this.timer = null
    this.volume = 0.4
    this.noiseNode = null
    this.breathGain = null
    this.breathFilter = null
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return false
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)
      this.masterGain.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return true
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05)
    }
  }

  setBpm(newBpm) {
    this.bpm = Math.max(40, Math.min(160, newBpm))
    if (this.isPlaying && this.activeOrgan === 'heart') {
      this.stopHeartLoop()
      this.startHeartLoop()
    }
  }

  setOrgan(organ) {
    const wasPlaying = this.isPlaying
    this.stop()
    this.activeOrgan = organ
    if (wasPlaying) {
      this.start()
    }
  }

  playCardiacTone(freq, duration, gainVal, time) {
    if (!this.ctx || !this.masterGain) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)
    // subtle pitch drop for organic thump
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, time + duration)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(140, time)

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(gainVal, time + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(time)
    osc.stop(time + duration)
  }

  startHeartLoop() {
    const intervalMs = (60 / this.bpm) * 1000

    const beat = () => {
      if (!this.isPlaying || !this.ctx) return
      const now = this.ctx.currentTime

      // S1 "Lub" sound (mitral/tricuspid closure - deeper, longer)
      this.playCardiacTone(58, 0.12, 0.8, now)
      this.playCardiacTone(110, 0.09, 0.35, now)

      // S2 "Dub" sound (aortic/pulmonic closure - sharper, higher)
      const s2Delay = Math.min(0.24, (intervalMs * 0.32) / 1000)
      this.playCardiacTone(88, 0.09, 0.65, now + s2Delay)
      this.playCardiacTone(145, 0.07, 0.25, now + s2Delay)

      this.timer = setTimeout(beat, intervalMs)
    }

    beat()
  }

  stopHeartLoop() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  startLungsSound() {
    if (!this.ctx || !this.masterGain) return

    // Procedural pink noise buffer for respiration
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.07
      b6 = white * 0.115926
    }

    this.noiseNode = this.ctx.createBufferSource()
    this.noiseNode.buffer = noiseBuffer
    this.noiseNode.loop = true

    this.breathFilter = this.ctx.createBiquadFilter()
    this.breathFilter.type = 'bandpass'
    this.breathFilter.frequency.setValueAtTime(450, this.ctx.currentTime)
    this.breathFilter.Q.setValueAtTime(1.8, this.ctx.currentTime)

    this.breathGain = this.ctx.createGain()
    this.breathGain.gain.setValueAtTime(0.01, this.ctx.currentTime)

    this.noiseNode.connect(this.breathFilter)
    this.breathFilter.connect(this.breathGain)
    this.breathGain.connect(this.masterGain)

    this.noiseNode.start(0)

    // Breathing rhythm: inhale ~2.2s, exhale ~2.4s
    const cycleBreathing = () => {
      if (!this.isPlaying || !this.ctx || !this.breathGain) return
      const now = this.ctx.currentTime

      // Inhale
      this.breathFilter.frequency.exponentialRampToValueAtTime(700, now + 1.8)
      this.breathGain.gain.linearRampToValueAtTime(0.35, now + 1.8)

      // Exhale
      this.breathFilter.frequency.exponentialRampToValueAtTime(320, now + 4.2)
      this.breathGain.gain.linearRampToValueAtTime(0.02, now + 4.2)

      this.timer = setTimeout(cycleBreathing, 4400)
    }

    cycleBreathing()
  }

  stopLungsSound() {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop()
        this.noiseNode.disconnect()
      } catch {}
      this.noiseNode = null
    }
  }

  start() {
    if (!this.init()) return
    this.isPlaying = true

    if (this.activeOrgan === 'heart') {
      this.startHeartLoop()
    } else if (this.activeOrgan === 'lungs') {
      this.startLungsSound()
    }
  }

  stop() {
    this.isPlaying = false
    this.stopHeartLoop()
    this.stopLungsSound()
  }

  toggle() {
    if (this.isPlaying) {
      this.stop()
      return false
    } else {
      this.start()
      return true
    }
  }

  // Subtle medical UI selection feedback chirp
  playClick() {
    if (!this.init()) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(780, now)
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)

    osc.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.05)
  }
}

export const soundEngine = new MedicalSoundEngine()
