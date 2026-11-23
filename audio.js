(() => {
  "use strict";

  const COOLDOWNS = Object.freeze({
    stretch: 0.1,
    launch: 0.08,
    impact: 0.065,
    wood: 0.08,
    glass: 0.1,
    stone: 0.09,
    explosion: 0.25,
    pig: 0.16,
    ability: 0.14,
    spring: 0.14,
    win: 1.4,
    lose: 1.0,
    click: 0.035,
  });
  const COLLISIONS = new Set(["impact", "wood", "glass", "stone"]);
  const MAX_VOICES = 8;
  const MAX_SOURCES = 32;

  class GameAudio {
    constructor() {
      this._context = null;
      this._master = null;
      this._compressor = null;
      this._noiseBuffer = null;
      this._muted = false;
      this._paused = false;
      this._disposed = false;
      this._voices = new Set();
      this._sourceCount = 0;
      this._lastPlayed = new Map();
      this._lastCollision = -Infinity;
    }

    unlock() {
      if (this._disposed || this._muted || this._paused) {
        return Promise.resolve(false);
      }
      try {
        if (!this._context || this._context.state === "closed") {
          this._release();
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (typeof AudioContext !== "function") return Promise.resolve(false);
          const context = new AudioContext();
          this._context = context;
          this._master = context.createGain();
          this._master.gain.value = 0;
          this._compressor = context.createDynamicsCompressor();
          this._compressor.threshold.value = -14;
          this._compressor.knee.value = 16;
          this._compressor.ratio.value = 10;
          this._compressor.attack.value = 0.003;
          this._compressor.release.value = 0.12;
          this._compressor.connect(this._master);
          this._master.connect(context.destination);
          this._noiseBuffer = context.createBuffer(
            1,
            context.sampleRate,
            context.sampleRate,
          );
          const samples = this._noiseBuffer.getChannelData(0);
          for (let i = 0; i < samples.length; i++)
            samples[i] = Math.random() * 2 - 1;
          context.onstatechange = () => {
            if (this._disposed || context !== this._context) return;
            if (context.state !== "running") this._silence();
            this._setOutput();
          };
        }
        this._setOutput();
        return this._changeState("resume");
      } catch (_) {
        this._release();
        return Promise.resolve(false);
      }
    }

    setMuted(muted) {
      if (this._disposed) return;
      this._muted = Boolean(muted);
      this._setOutput();
      if (this._muted) {
        this._silence();
      } else if (
        !this._paused &&
        this._context &&
        this._context.state !== "running"
      ) {
        this._changeState("resume");
      }
    }

    suspend() {
      if (this._disposed) return Promise.resolve(false);
      this._paused = true;
      this._setOutput();
      this._silence();
      return this._changeState("suspend");
    }

    resume() {
      if (this._disposed) return Promise.resolve(false);
      this._paused = false;
      this._setOutput();
      if (this._muted) return Promise.resolve(false);
      return this._changeState("resume");
    }

    play(name, intensity = 1) {
      const context = this._context;
      if (
        this._disposed ||
        this._muted ||
        this._paused ||
        !context ||
        context.state !== "running" ||
        typeof name !== "string" ||
        !Object.prototype.hasOwnProperty.call(COOLDOWNS, name) ||
        typeof intensity !== "number" ||
        !Number.isFinite(intensity) ||
        intensity <= 0
      ) {
        return false;
      }
      const now = context.currentTime;
      const last = this._lastPlayed.get(name);
      const collision = COLLISIONS.has(name);
      if (
        (last !== undefined && now - last < COOLDOWNS[name]) ||
        (collision && now - this._lastCollision < 0.045)
      )
        return false;

      let voice;
      try {
        const level = Math.min(intensity, 1.5);
        const parts = this._recipe(name, level);
        const priority =
          name === "win" || name === "lose"
            ? 3
            : ["launch", "ability", "explosion"].includes(name)
              ? 2
              : collision || name === "stretch"
                ? 0
                : 1;
        while (
          this._voices.size >= MAX_VOICES ||
          this._sourceCount + parts.length > MAX_SOURCES
        ) {
          let victim = null;
          for (const candidate of this._voices) {
            if (
              candidate.priority <= priority &&
              (!victim || candidate.priority < victim.priority)
            ) {
              victim = candidate;
            }
          }
          if (!victim) return false;
          this._stopVoice(victim);
        }
        voice = {
          gain: context.createGain(),
          sources: new Set(),
          priority,
          time: now + 0.005,
        };
        this._voices.add(voice);
        voice.gain.gain.value =
          (0.8 * Math.sqrt(level)) / (1 + (this._voices.size - 1) * 0.1);
        voice.gain.connect(this._compressor);
        for (const part of parts) this._schedule(voice, part);
        this._lastPlayed.set(name, now);
        if (collision) this._lastCollision = now;
        return true;
      } catch (_) {
        if (voice) this._stopVoice(voice);
        return false;
      }
    }

    dispose() {
      if (this._disposed) return;
      this._disposed = true;
      this._muted = true;
      this._setOutput();
      this._release();
    }

    _changeState(action) {
      const context = this._context;
      if (!context || context.state === "closed") return Promise.resolve(false);
      try {
        const result = context[action]();
        return Promise.resolve(result).then(
          () => {
            if (this._disposed || context !== this._context) return false;
            this._setOutput();
            return action === "resume"
              ? !this._muted && !this._paused && context.state === "running"
              : context.state === "suspended";
          },
          () => false,
        );
      } catch (_) {
        return Promise.resolve(false);
      }
    }

    _setOutput() {
      if (!this._master || !this._context) return;
      try {
        const gain = this._master.gain;
        const now = this._context.currentTime;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(
          this._muted ||
            this._paused ||
            this._disposed ||
            this._context.state !== "running"
            ? 0
            : 0.72,
          now,
        );
      } catch (_) {}
    }

    _disconnect(node) {
      if (!node) return;
      try {
        node.disconnect();
      } catch (_) {}
    }

    _finishSource(voice, record) {
      if (!voice.sources.delete(record)) return;
      if (record.source) record.source.onended = null;
      for (const node of record.nodes) this._disconnect(node);
      this._sourceCount--;
      if (!voice.sources.size) {
        this._disconnect(voice.gain);
        this._voices.delete(voice);
      }
    }

    _stopVoice(voice) {
      this._disconnect(voice.gain);
      for (const record of Array.from(voice.sources)) {
        if (record.source) {
          try {
            record.source.stop();
          } catch (_) {}
        }
        this._finishSource(voice, record);
      }
      this._voices.delete(voice);
    }

    _silence() {
      for (const voice of Array.from(this._voices)) this._stopVoice(voice);
      this._lastPlayed.clear();
      this._lastCollision = -Infinity;
    }

    _release() {
      this._silence();
      this._disconnect(this._compressor);
      this._disconnect(this._master);
      const context = this._context;
      this._context = null;
      this._master = null;
      this._compressor = null;
      this._noiseBuffer = null;
      if (context) {
        context.onstatechange = null;
        try {
          if (context.state !== "closed")
            Promise.resolve(context.close()).catch(() => {});
        } catch (_) {}
      }
    }

    _sweep(parameter, frequencies, time, duration) {
      const limit = this._context.sampleRate * 0.45;
      const clamp = (value) => Math.max(20, Math.min(limit, value));
      parameter.setValueAtTime(clamp(frequencies[0]), time);
      for (let i = 1; i < frequencies.length; i++) {
        parameter.exponentialRampToValueAtTime(
          clamp(frequencies[i]),
          time + (duration * i) / (frequencies.length - 1),
        );
      }
    }

    _schedule(voice, part) {
      const context = this._context;
      const record = { source: null, nodes: [] };
      voice.sources.add(record);
      this._sourceCount++;
      const source = part.noise
        ? context.createBufferSource()
        : context.createOscillator();
      record.source = source;
      record.nodes.push(source);
      const envelope = context.createGain();
      record.nodes.push(envelope);
      const start = voice.time + part.delay;
      const end = start + part.duration;
      if (part.noise) {
        source.buffer = this._noiseBuffer;
        const filter = context.createBiquadFilter();
        record.nodes.push(filter);
        filter.type = part.type;
        filter.Q.value = part.q;
        this._sweep(filter.frequency, part.frequencies, start, part.duration);
        source.connect(filter);
        filter.connect(envelope);
      } else {
        source.type = part.type;
        this._sweep(source.frequency, part.frequencies, start, part.duration);
        source.connect(envelope);
      }
      const attack = Math.min(part.attack, part.duration * 0.3);
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(part.gain, start + attack);
      envelope.gain.exponentialRampToValueAtTime(0.0001, end - 0.003);
      envelope.gain.linearRampToValueAtTime(0, end);
      envelope.connect(voice.gain);
      source.onended = () => this._finishSource(voice, record);
      if (part.noise) {
        const offset =
          Math.random() *
          Math.max(0, this._noiseBuffer.duration - part.duration - 0.02);
        source.start(start, offset);
      } else {
        source.start(start);
      }
      source.stop(end + 0.005);
    }

    _recipe(name, intensity) {
      const parts = [];
      const tone = (
        delay,
        duration,
        frequencies,
        gain,
        type = "sine",
        attack = 0.004,
      ) => {
        parts.push({
          delay,
          duration,
          frequencies: [].concat(frequencies),
          gain,
          type,
          attack,
        });
      };
      const noise = (
        delay,
        duration,
        frequencies,
        gain,
        type = "bandpass",
        q = 0.8,
      ) => {
        parts.push({
          noise: true,
          delay,
          duration,
          frequencies: [].concat(frequencies),
          gain,
          type,
          q,
          attack: 0.003,
        });
      };
      const jitter = 0.94 + Math.random() * 0.12;
      switch (name) {
        case "stretch": {
          const pitch = (140 + intensity * 120) * jitter;
          tone(
            0,
            0.16,
            [pitch, pitch * 1.3, pitch * 1.16, pitch * 1.5],
            0.2,
            "triangle",
            0.014,
          );
          tone(0.025, 0.1, [pitch * 2.04, pitch * 2.4], 0.035);
          noise(0, 0.1, [950, 1700], 0.09, "bandpass", 3);
          break;
        }
        case "launch":
          tone(0, 0.19, [280, 620, 95], 0.32, "triangle");
          tone(0.012, 0.18, [125, 48], 0.34);
          noise(0.015, 0.2, [650, 4200], 0.28, "highpass");
          break;
        case "impact":
          tone(0, 0.17, [145 * jitter, 46], 0.48);
          tone(0, 0.055, [370 * jitter, 135], 0.13, "triangle");
          noise(0, 0.085, [1800, 400], 0.3);
          break;
        case "wood":
          tone(0, 0.15, [245 * jitter, 135], 0.35, "triangle");
          tone(0, 0.07, [610 * jitter, 360], 0.16);
          tone(0.036, 0.09, [370 * jitter, 190], 0.12, "triangle");
          noise(0, 0.06, [1600, 700], 0.33, "bandpass", 1.5);
          break;
        case "glass":
          [1381, 2137, 3373, 4651].forEach((frequency, i) => {
            tone(
              i * 0.009,
              0.34 - i * 0.045,
              frequency * jitter,
              0.14 / (1 + i * 0.4),
            );
          });
          noise(0, 0.105, [5000, 2200], 0.19, "highpass");
          tone(0.072, 0.18, [2791 * jitter, 2500 * jitter], 0.055);
          break;
        case "stone":
          tone(0, 0.22, [94 * jitter, 43], 0.47);
          tone(0, 0.1, [457 * jitter, 340], 0.17, "triangle");
          tone(0.012, 0.13, 713 * jitter, 0.065);
          noise(0, 0.13, [2100, 290], 0.42, "lowpass");
          break;
        case "explosion":
          tone(0, 0.48, [145, 52, 27], 0.57);
          tone(0.018, 0.23, [260, 61], 0.18, "triangle");
          noise(0, 0.53, [6500, 1000, 100], 0.63, "lowpass");
          noise(0, 0.085, [4200, 1300], 0.24, "highpass");
          [0.1, 0.18, 0.27].forEach((delay, i) => {
            noise(delay, 0.11, [1500 - i * 260, 260], 0.16 / (i + 1));
          });
          break;
        case "pig":
          tone(
            0,
            0.19,
            [330, 510, 470, 285].map((f) => f * jitter),
            0.25,
            "triangle",
            0.018,
          );
          tone(0.025, 0.11, [650, 890, 590], 0.042, "sawtooth", 0.01);
          noise(0.1, 0.14, [1050, 440], 0.24, "bandpass", 2.5);
          tone(0.16, 0.13, [225 * jitter, 155], 0.23, "triangle", 0.01);
          break;
        case "ability":
          [440, 660, 990, 1485].forEach((frequency, i) => {
            tone(
              i * 0.055,
              0.22,
              [frequency, frequency * 1.035],
              0.2,
              "triangle",
              0.008,
            );
          });
          tone(0.2, 0.28, [1980, 2640], 0.075);
          noise(0.03, 0.2, [2200, 7000], 0.075, "highpass");
          break;
        case "spring":
          tone(0, 0.48, [180, 620, 230, 490, 260, 400, 290], 0.4);
          tone(0, 0.29, [360, 1240, 460, 980, 520], 0.075, "triangle");
          noise(0, 0.035, [1300, 500], 0.12);
          break;
        case "win": {
          const notes = [0, 7, 16, 12, 19, 14, 24];
          const times = [0, 0.09, 0.21, 0.32, 0.42, 0.53, 0.69];
          notes.forEach((semitones, i) => {
            tone(
              times[i],
              i === 6 ? 0.49 : 0.23,
              293.6648 * Math.pow(2, semitones / 12),
              i === 6 ? 0.25 : 0.21,
              "triangle",
              0.006,
            );
          });
          tone(0, 0.55, 146.8324, 0.19);
          tone(0.69, 0.46, 739.9888, 0.1);
          tone(0.7, 0.39, 2349.3184, 0.065);
          break;
        }
        case "lose":
          tone(0, 0.23, [293.66, 261.63], 0.28, "triangle", 0.014);
          tone(0.2, 0.26, [246.94, 196], 0.26, "triangle", 0.014);
          tone(0.44, 0.42, [174.61, 164.81, 130.81], 0.3, "triangle", 0.014);
          tone(0.46, 0.37, [87.3, 65.4], 0.18);
          break;
        case "click":
          tone(0, 0.047, [820, 540], 0.19);
          tone(0, 0.021, [1560, 1020], 0.065, "triangle", 0.002);
          break;
      }
      return parts;
    }
  }

  window.GameAudio = GameAudio;
})();
