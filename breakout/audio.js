/**
 * 🎵 Breakout Classic - Web Audio API Synthesizer
 * 별도의 오디오 파일 없이 순수 Web Audio API로 풍부한 레트로 아케이드 효과음을 생성합니다.
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.35;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  // 기본 톤 재생 유틸리티
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1, startDelay = 0, pitchEnd = null) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime + startDelay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (pitchEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, pitchEnd), now + duration);
      }

      const peakGain = gainVal * this.volume;
      gain.gain.setValueAtTime(peakGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Audio playback safe ignore
    }
  }

  // 노이즈 버퍼 생성 (폭발, 타격 등)
  createNoiseBuffer(duration = 0.2) {
    if (!this.ctx) return null;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // 패들 튕김 (공이 패들의 어느 위치에 맞았는지에 따라 음높이 변화)
  paddleHit(offsetRatio = 0) {
    this.init();
    const baseFreq = 380;
    const freq = baseFreq + Math.abs(offsetRatio) * 160;
    this.playTone(freq, 'triangle', 0.08, 0.2, 0, freq * 0.85);
  }

  // 벽 충돌음
  wallHit() {
    this.init();
    this.playTone(480, 'sine', 0.04, 0.12, 0, 360);
  }

  // 벽돌 타격 & 파괴 (콤보에 따라 음계 상승)
  brickHit(points = 50, combo = 1) {
    this.init();
    if (this.muted || !this.ctx) return;

    // 펜타토닉 음계 (C5 ~ C7)
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
    const noteIndex = Math.min(Math.floor(combo - 1) % scale.length, scale.length - 1);
    const freq = scale[noteIndex];

    this.playTone(freq, 'square', 0.09, 0.15, 0, freq * 1.05);
    // 풍성한 8비트 화음 보강
    this.playTone(freq * 0.5, 'triangle', 0.07, 0.1, 0.01);
  }

  // 단단한 은색/금색 벽돌 피격음 (금속 둔탁한 소리)
  hardHit() {
    this.init();
    this.playTone(720, 'square', 0.05, 0.14, 0, 400);
    this.playTone(280, 'triangle', 0.07, 0.16);
  }

  // 폭탄 벽돌 폭발음 (중후한 폭발 효과)
  bombExplode() {
    this.init();
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const noiseBuffer = this.createNoiseBuffer(0.45);
      if (noiseBuffer) {
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + 0.4);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + 0.45);
      }

      // 저음 럼블
      this.playTone(160, 'sawtooth', 0.35, 0.3, 0, 30);
    } catch (e) {}
  }

  // 레이저 발사음
  laserShoot() {
    this.init();
    this.playTone(950, 'sawtooth', 0.08, 0.16, 0, 180);
  }

  // 레이저 명중음
  laserHit() {
    this.init();
    this.playTone(600, 'square', 0.04, 0.1, 0, 250);
  }

  // 아이템 획득 사운드 (기분 좋은 4음 아르페지오)
  powerupCollect() {
    this.init();
    if (this.muted || !this.ctx) return;
    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.12, 0.16, idx * 0.04);
    });
  }

  // 생명 소진 / 볼 분실 사운드
  lifeLost() {
    this.init();
    if (this.muted || !this.ctx) return;
    const sadNotes = [440, 415.3, 392, 349.23];
    sadNotes.forEach((freq, idx) => {
      this.playTone(freq, 'sawtooth', 0.16, 0.2, idx * 0.08, freq * 0.9);
    });
  }

  // 스테이지 클리어 축하 팡파르
  stageClear() {
    this.init();
    if (this.muted || !this.ctx) return;
    const melody = [
      { f: 523.25, d: 0.1, t: 0.0 },   // C5
      { f: 659.25, d: 0.1, t: 0.1 },   // E5
      { f: 783.99, d: 0.1, t: 0.2 },   // G5
      { f: 1046.50, d: 0.3, t: 0.32 }, // C6
      { f: 880.00, d: 0.12, t: 0.5 },  // A5
      { f: 1046.50, d: 0.45, t: 0.65 } // C6 (길게)
    ];
    melody.forEach(m => {
      this.playTone(m.f, 'triangle', m.d, 0.22, m.t);
      this.playTone(m.f * 0.5, 'sine', m.d, 0.14, m.t);
    });
  }

  // 게임 오버 징글
  gameOver() {
    this.init();
    if (this.muted || !this.ctx) return;
    const notes = [
      { f: 392.00, d: 0.2, t: 0.0 },  // G4
      { f: 369.99, d: 0.2, t: 0.22 }, // F#4
      { f: 349.23, d: 0.2, t: 0.44 }, // F4
      { f: 329.63, d: 0.5, t: 0.68 }  // E4
    ];
    notes.forEach(n => {
      this.playTone(n.f, 'sawtooth', n.d, 0.22, n.t, n.f * 0.95);
      this.playTone(n.f * 0.5, 'triangle', n.d, 0.25, n.t);
    });
  }

  // 버튼 클릭음
  uiClick() {
    this.init();
    this.playTone(800, 'sine', 0.03, 0.08, 0, 600);
  }
}

window.soundEngine = new SoundController();
