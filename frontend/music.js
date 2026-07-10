const tracks = [
  { name: 'Island Lobby', tempo: 82, root: 45, bass: [0, 0, 5, 7], melody: [12, 16, 19, 16, 14, 12, 9, 11] },
  { name: 'Treasure Skank', tempo: 86, root: 45, bass: [0, 0, 5, 7], melody: [12, 14, 16, 19, 16, 14, 12, 9] },
  { name: 'Kingston Steps', tempo: 90, root: 43, bass: [0, 5, 7, 3], melody: [12, 15, 19, 17, 15, 12, 10, 12] },
  { name: 'River Echo', tempo: 84, root: 48, bass: [0, 7, 5, 0], melody: [12, 16, 19, 21, 19, 16, 14, 12] },
  { name: 'Coconut Rock', tempo: 94, root: 41, bass: [0, 3, 5, 7], melody: [12, 15, 17, 19, 22, 19, 17, 15] },
  { name: 'Port Royal Dub', tempo: 80, root: 38, bass: [0, 0, 7, 5], melody: [12, 19, 17, 15, 12, 10, 7, 10] },
  { name: 'Rainforest Riddim', tempo: 88, root: 46, bass: [0, 5, 3, 7], melody: [12, 14, 17, 21, 17, 14, 10, 12] },
  { name: 'Volcano Pulse', tempo: 98, root: 40, bass: [0, 7, 3, 5], melody: [12, 15, 19, 22, 19, 17, 15, 10] },
  { name: 'Moonlight Dub', tempo: 78, root: 44, bass: [0, 5, 0, 7], melody: [12, 16, 18, 23, 18, 16, 11, 14] },
  { name: 'Reef Rocksteady', tempo: 92, root: 42, bass: [0, 3, 7, 5], melody: [12, 15, 19, 20, 19, 15, 12, 10] },
  { name: 'Last Laugh Ska', tempo: 104, root: 39, bass: [0, 5, 7, 10], melody: [12, 15, 17, 22, 20, 17, 15, 12] }
];

function frequencyFromMidi(note) {
  return 440 * (2 ** ((note - 69) / 12));
}

class IslandMusicPlayer {
  constructor(onStateChange) {
    this.context = null;
    this.master = null;
    this.timer = null;
    this.trackIndex = 0;
    this.step = 0;
    this.nextStepTime = 0;
    this.enabled = false;
    try {
      this.muted = localStorage.getItem('jamaicaDashMusicMuted') === 'true';
    } catch {
      this.muted = false;
    }
    this.noiseBuffer = null;
    this.onStateChange = onStateChange;
  }

  async enable() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.16;
      this.master.connect(this.context.destination);
      this.noiseBuffer = this.context.createBuffer(1, Math.floor(this.context.sampleRate * 0.05), this.context.sampleRate);
      const noise = this.noiseBuffer.getChannelData(0);
      for (let index = 0; index < noise.length; index += 1) noise[index] = Math.random() * 2 - 1;
      this.nextStepTime = this.context.currentTime + 0.06;
      this.timer = window.setInterval(() => this.schedule(), 35);
    }

    if (this.context.state === 'suspended') await this.context.resume();
    this.enabled = true;
    this.onStateChange?.(this.state());
  }

  setLobby() {
    this.setTrack(0);
  }

  setLevel(levelIndex) {
    this.setTrack(Math.max(1, Math.min(tracks.length - 1, levelIndex + 1)));
  }

  setTrack(index) {
    if (this.trackIndex === index && this.step !== 0) return;
    this.trackIndex = index;
    this.step = 0;
    if (this.context) this.nextStepTime = this.context.currentTime + 0.08;
    this.onStateChange?.(this.state());
  }

  toggle() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('jamaicaDashMusicMuted', String(this.muted));
    } catch {
      // Music still works when browser storage is unavailable.
    }
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.16, this.context.currentTime, 0.04);
    }
    this.onStateChange?.(this.state());
  }

  state() {
    return {
      enabled: this.enabled,
      muted: this.muted,
      trackName: tracks[this.trackIndex].name
    };
  }

  schedule() {
    if (!this.context || !this.enabled || this.context.state !== 'running') return;
    while (this.nextStepTime < this.context.currentTime + 0.16) {
      this.scheduleStep(this.step, this.nextStepTime);
      const secondsPerStep = (60 / tracks[this.trackIndex].tempo) / 4;
      this.nextStepTime += secondsPerStep;
      this.step = (this.step + 1) % 16;
    }
  }

  scheduleStep(step, time) {
    const track = tracks[this.trackIndex];
    const beat = Math.floor(step / 4);

    if (step === 0 || step === 8) this.kick(time, step === 0 ? 0.12 : 0.085);
    if (step === 4 || step === 12) this.rim(time);
    if (step % 2 === 1) this.hat(time, step % 4 === 3 ? 0.018 : 0.012);

    if (step % 4 === 0) {
      const bassNote = track.root + track.bass[beat];
      this.tone(frequencyFromMidi(bassNote), 'triangle', time, 0.28, 0.105);
    }

    if ([2, 6, 10, 14].includes(step)) {
      const chordRoot = track.root + 12 + track.bass[beat];
      this.tone(frequencyFromMidi(chordRoot), 'square', time, 0.085, 0.026);
      this.tone(frequencyFromMidi(chordRoot + 4), 'square', time, 0.085, 0.019);
      this.tone(frequencyFromMidi(chordRoot + 7), 'square', time, 0.085, 0.017);
    }

    if (step % 2 === 0) {
      const melodyNote = track.root + track.melody[(step / 2) % track.melody.length];
      this.tone(frequencyFromMidi(melodyNote), 'sine', time + 0.012, 0.12, 0.027);
    }
  }

  tone(frequency, type, time, duration, volume) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.025);
  }

  kick(time, volume) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(120, time);
    oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.11);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.14);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + 0.15);
  }

  rim(time) {
    this.tone(720, 'square', time, 0.035, 0.022);
    this.tone(1040, 'square', time + 0.006, 0.025, 0.012);
  }

  hat(time, volume) {
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = 5500;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.035);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(time);
  }
}

export function createMusicPlayer(onStateChange) {
  return new IslandMusicPlayer(onStateChange);
}
