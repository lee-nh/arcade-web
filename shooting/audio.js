// 1990s Retro Arcade Synthesizer (Web Audio API)
// Authentic FM/Chiptune sound effects and dynamic background music

class RetroAudio {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.5;
        this.bgmVolume = 0.35;
        this.sfxVolume = 0.6;
        this.isMuted = false;
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.bgmTempo = 138; // BPM
        this.isBgmPlaying = false;
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
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    // --- Sound Effects ---

    playShoot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

        gain.gain.setValueAtTime(0.15 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playLaser() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playEnemyShoot() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.1);

        gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    playHit() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playExplosion(large = false) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const duration = large ? 0.6 : 0.25;

        // White noise buffer
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = buffer;

        // Lowpass filter for punchy arcade explosion sound
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(large ? 400 : 800, now);
        filter.frequency.exponentialRampToValueAtTime(40, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(large ? 0.45 * this.sfxVolume : 0.3 * this.sfxVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        whiteNoise.start(now);
        whiteNoise.stop(now + duration);

        // Low sub-bass thump
        if (large) {
            const osc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
            subGain.gain.setValueAtTime(0.5 * this.sfxVolume, now);
            subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.connect(subGain);
            subGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }

    playBomb() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        
        // Rising charge
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.3);
        oscGain.gain.setValueAtTime(0.25 * this.sfxVolume, now);
        oscGain.gain.linearRampToValueAtTime(0.01, now + 0.35);

        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);

        // Mega blast after 0.2s
        setTimeout(() => {
            this.playExplosion(true);
            setTimeout(() => this.playExplosion(true), 150);
        }, 200);
    }

    playPowerUp() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.18 * this.sfxVolume, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.08);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.08);
        });
    }

    playBossWarning() {
        if (!this.ctx || this.isMuted) return;
        let count = 0;
        const siren = () => {
            if (count++ >= 3 || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(450, now);
            osc.frequency.linearRampToValueAtTime(700, now + 0.2);
            gain.gain.setValueAtTime(0.2 * this.sfxVolume, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
            setTimeout(siren, 300);
        };
        siren();
    }

    // --- Dynamic 90s Chiptune Arcade BGM ---

    startBGM() {
        if (this.isBgmPlaying) return;
        this.init();
        this.isBgmPlaying = true;
        this.bgmStep = 0;

        // 16-step bassline sequence (in Em / D / C / B)
        // Authentic 90s driving arcade progression
        const bassNotes = [
            164.81, 164.81, 0, 164.81,  196.00, 164.81, 146.83, 164.81, // E3, E3, -, E3, G3, E3, D3, E3
            146.83, 146.83, 0, 146.83,  164.81, 146.83, 130.81, 146.83, // D3, D3, -, D3, E3, D3, C3, D3
            130.81, 130.81, 0, 130.81,  146.83, 130.81, 123.47, 130.81, // C3, C3, -, C3, D3, C3, B2, C3
            123.47, 123.47, 146.83, 164.81, 196.00, 220.00, 246.94, 0   // B2, B2, D3, E3, G3, A3, B3, -
        ];

        // Lead melody pattern (32 steps)
        const leadNotes = [
            329.63, 0, 392.00, 0,  440.00, 392.00, 329.63, 0, // E4, G4, A4, G4, E4
            293.66, 0, 329.63, 0,  369.99, 0,      293.66, 0, // D4, E4, F#4, D4
            261.63, 0, 293.66, 0,  329.63, 293.66, 261.63, 0, // C4, D4, E4, D4, C4
            246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 0 // B3, D4, E4, G4, A4, B4, D5
        ];

        const stepTime = (60 / this.bgmTempo) / 4 * 1000; // 16th notes

        this.bgmInterval = setInterval(() => {
            if (!this.isBgmPlaying || !this.ctx || this.isMuted) {
                this.bgmStep = (this.bgmStep + 1) % 32;
                return;
            }

            const now = this.ctx.currentTime;

            // 1. Drum beat: Kick on 0, 4, 8, 12; Snare on 4, 12; HiHat on every 2 steps
            const stepMod16 = this.bgmStep % 16;
            if (stepMod16 % 4 === 0) {
                // Kick
                const kickOsc = this.ctx.createOscillator();
                const kickGain = this.ctx.createGain();
                kickOsc.frequency.setValueAtTime(150, now);
                kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
                kickGain.gain.setValueAtTime(0.25 * this.bgmVolume, now);
                kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                kickOsc.connect(kickGain);
                kickGain.connect(this.ctx.destination);
                kickOsc.start(now);
                kickOsc.stop(now + 0.08);
            }

            if (stepMod16 === 4 || stepMod16 === 12) {
                // Snare (Noise burst + mid tone)
                const snareOsc = this.ctx.createOscillator();
                const snareGain = this.ctx.createGain();
                snareOsc.type = 'triangle';
                snareOsc.frequency.setValueAtTime(220, now);
                snareGain.gain.setValueAtTime(0.18 * this.bgmVolume, now);
                snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);
                snareOsc.connect(snareGain);
                snareGain.connect(this.ctx.destination);
                snareOsc.start(now);
                snareOsc.stop(now + 0.07);
            }

            if (this.bgmStep % 2 === 0) {
                // Hi-Hat
                const hatOsc = this.ctx.createOscillator();
                const hatGain = this.ctx.createGain();
                hatOsc.type = 'sawtooth';
                hatOsc.frequency.setValueAtTime(9000, now);
                hatGain.gain.setValueAtTime(0.04 * this.bgmVolume, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
                hatOsc.connect(hatGain);
                hatGain.connect(this.ctx.destination);
                hatOsc.start(now);
                hatOsc.stop(now + 0.02);
            }

            // 2. Bass synthesizer (Fat punchy sawtooth bass)
            const bassFreq = bassNotes[this.bgmStep % 32];
            if (bassFreq > 0) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'sawtooth';
                bassOsc.frequency.setValueAtTime(bassFreq / 2, now); // 1 octave lower
                bassGain.gain.setValueAtTime(0.15 * this.bgmVolume, now);
                bassGain.gain.exponentialRampToValueAtTime(0.02, now + 0.1);
                bassOsc.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 0.1);
            }

            // 3. Lead synthesizer (Classic 90s square-wave lead)
            const leadFreq = leadNotes[this.bgmStep % 32];
            if (leadFreq > 0) {
                const leadOsc = this.ctx.createOscillator();
                const leadGain = this.ctx.createGain();
                leadOsc.type = 'square';
                leadOsc.frequency.setValueAtTime(leadFreq, now);
                leadGain.gain.setValueAtTime(0.08 * this.bgmVolume, now);
                leadGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                leadOsc.connect(leadGain);
                leadGain.connect(this.ctx.destination);
                leadOsc.start(now);
                leadOsc.stop(now + 0.12);
            }

            this.bgmStep = (this.bgmStep + 1) % 32;
        }, stepTime);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.isBgmPlaying = false;
    }
}

window.retroAudio = new RetroAudio();
