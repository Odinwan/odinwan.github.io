/**
 * Sound for the Tale scene, synthesised on the fly with the Web Audio API — no
 * audio files. Voices are built to sound like things rather than like a chip:
 * struck bells with inharmonic partials, formant-filtered "throats" for the
 * animals, noise shaped into paper, breath and steam, all sent through a small
 * generated room reverb. Every sound is started by a click, so browsers allow it.
 */

const KEY = 'tale-sound';
const VOLUME = 0.7;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
/** Everything plays into the bus; the bus feeds the output dry and through the reverb. */
let bus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let enabled = (() => {
  try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; }
})();

export const isSoundOn = (): boolean => enabled;

export const setSoundOn = (on: boolean): void => {
  enabled = on;
  try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch { /* noop */ }
  if (master && ctx) master.gain.setTargetAtTime(on ? VOLUME : 0, ctx.currentTime, 0.03);
};

const whiteNoise = (ac: AudioContext, seconds: number): AudioBuffer => {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * seconds), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buf;
};

/**
 * Browsers start an audio context suspended and wake it only from inside a real tap, click or key press.
 * Mobile Safari is strict about which events count (a touch that ends, a click — not the start of a press),
 * so listen to all of them and keep trying until the context is actually running.
 */
const UNLOCK_EVENTS = ['touchend', 'pointerup', 'click', 'keydown'] as const;
const armUnlock = (ac: AudioContext): void => {
  const wake = () => {
    if (ac.state === 'running') {
      UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, wake, true));
      return;
    }
    // A hidden tab stays quiet; setAudioAwake brings it back when it is looked at again.
    if (enabled && !document.hidden) void ac.resume().catch(() => undefined);
  };
  UNLOCK_EVENTS.forEach((type) => window.addEventListener(type, wake, true));
};

const audio = (): AudioContext | null => {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    // iPhones: by default page audio obeys the ring/silent switch, so a muted phone plays nothing.
    // Declaring this as playback (where the API exists) makes it behave like any music or video page.
    try {
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = 'playback';
    } catch { /* not supported: nothing to do */ }
    armUnlock(ctx);
    master = ctx.createGain();
    master.gain.value = enabled ? VOLUME : 0;
    // A gentle limiter so layered sounds never clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 6;
    master.connect(limiter).connect(ctx.destination);

    bus = ctx.createGain();
    bus.connect(master);
    // A wood-panelled room: a couple of seconds of decaying noise as the impulse response.
    const len = Math.floor(ctx.sampleRate * 2.4);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.2;
    bus.connect(reverb).connect(wet).connect(master);
    noiseBuf = whiteNoise(ctx, 2);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

/** An amplitude envelope: silence → peak over `attack`, then an exponential fall to silence at `dur`. */
const envelope = (ac: AudioContext, at: number, dur: number, peak: number, attack: number): GainNode => {
  const g = ac.createGain();
  const t0 = ac.currentTime + at;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + Math.min(attack, dur * 0.9));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  return g;
};

interface Tone {
  type?: OscillatorType;
  f: number;
  /** End frequency; the pitch glides there. */
  to?: number;
  at?: number;
  dur: number;
  gain?: number;
  attack?: number;
  /** Low-pass cutoff, to soften bright waveforms. */
  lp?: number;
  /** Vibrato: rate in Hz and depth in Hz. */
  vib?: [number, number];
  detune?: number;
}

const tone = ({ type = 'sine', f, to, at = 0, dur, gain = 0.15, attack = 0.008, lp, vib, detune = 0 }: Tone): void => {
  const ac = audio();
  if (!ac || !bus) return;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.detune.value = detune;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  let out: AudioNode = osc;
  if (lp) {
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lp;
    out.connect(filter);
    out = filter;
  }
  if (vib) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = vib[0];
    depth.gain.value = vib[1];
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  out.connect(envelope(ac, at, dur, gain, attack)).connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
};

interface Noise {
  at?: number;
  dur: number;
  gain?: number;
  kind?: BiquadFilterType;
  f: number;
  to?: number;
  q?: number;
  attack?: number;
}

const noise = ({ at = 0, dur, gain = 0.15, kind = 'bandpass', f, to, q = 1, attack = 0.01 }: Noise): void => {
  const ac = audio();
  if (!ac || !bus || !noiseBuf) return;
  const t0 = ac.currentTime + at;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = kind;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(f, t0);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  src.connect(filter).connect(envelope(ac, at, dur, gain, attack)).connect(bus);
  src.start(t0, Math.random());
  src.stop(t0 + dur + 0.05);
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/* ---------- instruments ---------- */

/** A struck bell or glass: inharmonic partials, the high ones dying first. */
const bell = (f: number, at = 0, dur = 1.4, gain = 0.1): void => {
  [[1, 1], [2.76, 0.55], [5.4, 0.3], [8.93, 0.16], [13.3, 0.07]].forEach(([ratio, level], i) => {
    tone({ f: f * ratio, at, dur: dur / (1 + i * 0.7), gain: gain * level, attack: 0.003 });
  });
};

/** A run of bells up a pentatonic scale — the sound of something enchanted. */
const sparkle = (base: number, at = 0, notes = 5, gain = 0.07): void => {
  [1, 1.125, 1.333, 1.5, 1.875, 2, 2.25].slice(0, notes).forEach((m, i) => bell(base * m, at + i * 0.07, 1.1, gain));
};

/** A warm sustained chord: detuned saws under a low-pass, slow in and slow out. */
const pad = (freqs: number[], at: number, dur: number, gain = 0.05, lp = 1400): void => {
  freqs.forEach((f) => {
    for (const detune of [-9, 7]) tone({ type: 'sawtooth', f, at, dur, gain, attack: dur * 0.35, lp, detune });
  });
};

/** A voice: a buzzing source through two or three resonances, the way a throat shapes sound. */
const voice = (opts: { f: number; to: number; at?: number; dur: number; gain?: number; formants: Array<[number, number]>; vib?: [number, number]; type?: OscillatorType }): void => {
  const ac = audio();
  if (!ac || !bus) return;
  const { f, to, at = 0, dur, gain = 0.2, formants, vib, type = 'sawtooth' } = opts;
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  if (vib) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = vib[0];
    depth.gain.value = vib[1];
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t0);
    lfo.stop(t0 + dur + 0.05);
  }
  const env = envelope(ac, at, dur, gain, dur * 0.18);
  formants.forEach(([freq, q]) => {
    const band = ac.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = freq;
    band.Q.value = q;
    osc.connect(band).connect(env);
  });
  env.connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
};

/** One bubble: a sine that chirps upward as it shrinks, like air rising through liquid. */
const bubble = (f: number, at: number, gain = 0.14): void => {
  tone({ f, to: f * 2.4, at, dur: 0.09, gain, attack: 0.004 });
};
const bubbles = (count: number, lo: number, hi: number, span: number, gain?: number): void => {
  for (let i = 0; i < count; i++) bubble(rnd(lo, hi), rnd(0, span), gain);
};

/** A dull knock on wood. */
const knock = (at = 0, f = 150, gain = 0.3): void => {
  tone({ f, to: f * 0.45, at, dur: 0.12, gain, attack: 0.002 });
  noise({ at, dur: 0.04, f: 900, kind: 'lowpass', gain: gain * 0.5, attack: 0.002 });
};

/** A key or a small hard thing clicking: a tick of noise and a low "thock" under it. */
const click = (at = 0, gain = 0.16): void => {
  noise({ at, dur: 0.018, f: rnd(2600, 4200), kind: 'bandpass', q: 1.5, gain, attack: 0.001 });
  tone({ f: rnd(170, 230), to: 110, at, dur: 0.05, gain: gain * 0.9, attack: 0.001 });
};

/** A spring wobbling to rest. */
const spring = (f: number, at = 0): void => {
  tone({ type: 'triangle', f, to: f * 2.2, at, dur: 0.42, gain: 0.16, vib: [26, f * 0.22], lp: 2600 });
  tone({ f: f * 0.5, to: f * 0.9, at, dur: 0.2, gain: 0.12 });
};

/** Air moving: a band of noise sweeping across the spectrum. */
const whoosh = (from: number, to: number, dur: number, at = 0, gain = 0.2, q = 0.7): void => {
  noise({ at, dur, f: from, to, gain, q, attack: dur * 0.35 });
};

const SOUNDS: Record<string, () => void> = {
  duck: () => {
    // A rubber squeak: a pinched nasal voice that drops, twice.
    voice({ f: 620, to: 380, dur: 0.17, gain: 0.7, formants: [[1150, 7], [2500, 6], [3400, 5]] });
    voice({ f: 560, to: 330, at: 0.21, dur: 0.22, gain: 0.65, formants: [[1000, 7], [2300, 6], [3300, 5]] });
    whoosh(2400, 900, 0.14, 0, 0.04, 2);
  },
  cat: () => {
    // "Me-ow": the mouth opens then closes, so the resonance rises and falls with the pitch.
    voice({ f: 430, to: 720, dur: 0.2, gain: 0.5, formants: [[900, 6], [2300, 8], [3200, 6]] });
    voice({ f: 720, to: 380, at: 0.18, dur: 0.55, gain: 0.5, formants: [[1250, 5], [2000, 7], [3000, 5]], vib: [6, 14] });
  },
  candle: () => {
    // A puff of breath and the wick's last hiss.
    whoosh(1400, 260, 0.5, 0, 0.3, 0.6);
    noise({ at: 0.3, dur: 0.5, f: 6000, kind: 'highpass', gain: 0.03 });
  },
  tomato: () => { spring(220); knock(0.4, 130, 0.2); },
  hat: () => { whoosh(500, 1800, 0.25, 0, 0.1); spring(150, 0.03); sparkle(1320, 0.15, 3, 0.05); },
  grove: () => { spring(300); spring(390, 0.09); spring(520, 0.18); },
  potion: () => { bubbles(10, 420, 1300, 0.6); knock(0, 420, 0.1); sparkle(1568, 0.12, 5, 0.06); },
  cauldron: () => { bubbles(14, 110, 380, 1.2, 0.2); whoosh(180, 620, 1.2, 0, 0.08, 0.5); bell(196, 0.05, 1.6, 0.05); },
  chest: () => {
    // A stiff hinge, the lid knocking back, coins settling.
    voice({ f: 70, to: 118, dur: 0.6, gain: 0.3, formants: [[520, 8], [1300, 10]], vib: [13, 9] });
    knock(0.55, 110, 0.35);
    for (let i = 0; i < 7; i++) bell(rnd(2200, 4200), 0.6 + i * 0.055 + rnd(0, 0.03), 0.5, 0.05);
  },
  lantern: () => { click(0, 0.25); bell(1320, 0.02, 0.5, 0.04); whoosh(700, 300, 0.25, 0.03, 0.06); },
  windowGroup: () => {
    // A falling star: a thin whistle down the sky, trailing glitter.
    tone({ f: 2600, to: 620, dur: 0.9, gain: 0.06, attack: 0.1, vib: [9, 30] });
    whoosh(5000, 1200, 0.9, 0, 0.05, 2);
    sparkle(2093, 0.25, 6, 0.045);
  },
  writing: () => {
    // Nib on paper: short dry strokes, then a tap on the inkwell.
    for (let i = 0; i < 5; i++) noise({ at: i * 0.085, dur: 0.07, f: rnd(3000, 4200), to: 2200, gain: 0.1, q: 2.5 });
    bell(1760, 0.46, 0.5, 0.04);
  },
  orbGroup: () => { pad([220, 277, 330], 0, 1.6, 0.04, 1800); sparkle(880, 0.05, 6, 0.06); },
  crystals: () => { bell(1568, 0, 1.8, 0.09); bell(2093, 0.09, 1.6, 0.07); bell(2637, 0.18, 1.5, 0.06); bell(3136, 0.3, 1.4, 0.04); },
  wand: () => { whoosh(600, 5000, 0.35, 0, 0.12, 1.5); sparkle(1760, 0.2, 7, 0.055); },
  laptop: () => { bell(880, 0, 0.6, 0.07); bell(1318, 0.11, 0.8, 0.07); click(0, 0.08); },
  keyboard: () => { for (let i = 0; i < 11; i++) click(i * 0.06 + rnd(0, 0.025), 0.17); },
  robot: () => {
    // A little servo voice: three syllables through a metallic throat.
    voice({ f: 180, to: 260, dur: 0.16, gain: 0.7, formants: [[650, 10], [1700, 12], [2900, 9]], vib: [38, 22] });
    voice({ f: 260, to: 210, at: 0.19, dur: 0.16, gain: 0.7, formants: [[1050, 10], [2200, 12], [3100, 9]], vib: [38, 22] });
    voice({ f: 170, to: 300, at: 0.38, dur: 0.26, gain: 0.7, formants: [[820, 10], [1900, 12], [3000, 9]], vib: [38, 22] });
    bell(1568, 0.62, 0.5, 0.03);
    whoosh(900, 2200, 0.5, 0, 0.03, 4);
  },
  caseLeft: () => {
    // An old machine waking: a relay, the tube humming up, the drive seeking.
    click(0, 0.3);
    tone({ type: 'sawtooth', f: 60, to: 118, at: 0.05, dur: 1.1, gain: 0.07, lp: 500, attack: 0.5 });
    tone({ f: 9000, to: 15000, at: 0.05, dur: 0.5, gain: 0.012, attack: 0.2 });
    for (let i = 0; i < 6; i++) click(0.5 + i * 0.09 + rnd(0, 0.03), 0.07);
    bell(988, 1.05, 0.6, 0.05);
  },
  caseRight: () => {
    // The router handshake, politely.
    whoosh(1800, 2600, 0.6, 0, 0.05, 6);
    [1046, 1318, 1568, 2093].forEach((f, i) => bell(f, 0.1 + i * 0.1, 0.5, 0.05));
  },
  bugJar: () => {
    // Glass tapped, and a lot of small legs.
    bell(2400, 0, 0.7, 0.09);
    knock(0, 380, 0.12);
    for (let i = 0; i < 16; i++) noise({ at: 0.08 + rnd(0, 0.7), dur: 0.02, f: rnd(3200, 5200), q: 3, gain: 0.07, attack: 0.002 });
  },
  mug: () => {
    // A slurp, a swallow, the mug set back down.
    whoosh(500, 2200, 0.38, 0, 0.16, 4);
    tone({ f: 190, to: 120, at: 0.42, dur: 0.12, gain: 0.15 });
    knock(0.62, 240, 0.22);
    bell(1900, 0.62, 0.3, 0.03);
  },
  engine: () => {
    // Cranks, catches, revs and settles with a hiss of steam.
    for (let i = 0; i < 18; i++) {
      const at = 0.05 + i * (0.2 - i * 0.008);
      knock(at, 78 + i * 3, 0.26);
      click(at + 0.05, 0.06);
    }
    tone({ type: 'sawtooth', f: 46, to: 126, dur: 1.4, gain: 0.16, lp: 480, attack: 0.25 });
    tone({ type: 'sawtooth', f: 126, to: 56, at: 1.4, dur: 1.2, gain: 0.14, lp: 400 });
    whoosh(5200, 1500, 0.9, 2.2, 0.1, 0.8);
    bell(660, 2.5, 0.8, 0.04);
  },
  cvScroll: () => {
    // Parchment unrolling and a small fanfare.
    whoosh(1100, 3400, 0.3, 0, 0.14, 1.2);
    pad([262, 330, 392], 0.1, 1.3, 0.035, 2200);
    [523, 659, 784, 1047].forEach((f, i) => bell(f, 0.14 + i * 0.1, 1.1, 0.08));
  },
  page: () => {
    // A leaf of paper lifting, bending and landing.
    whoosh(3200, 900, 0.22, 0, 0.13, 0.9);
    whoosh(900, 2400, 0.12, 0.16, 0.06, 1.5);
    knock(0.26, 260, 0.05);
  },
  bookClose: () => {
    knock(0, 95, 0.5);
    whoosh(600, 180, 0.3, 0, 0.14, 0.6);
    bell(392, 0.05, 1.2, 0.03);
  },
  /** About 1.6 s of something straining to get out, then it does. Timed to the scene's opening shot. */
  bookOpen: () => {
    // The strain: a low swell, a rising wind, a heartbeat that quickens, the clasp rattling.
    tone({ type: 'sawtooth', f: 36, to: 72, dur: 1.65, gain: 0.2, lp: 240, attack: 0.7 });
    pad([55, 82.5, 110], 0, 1.7, 0.07, 500);
    whoosh(140, 2200, 1.6, 0, 0.16, 0.5);
    tone({ f: 220, to: 1100, dur: 1.6, gain: 0.035, attack: 1.2 });
    for (let i = 0; i < 7; i++) knock(i * (0.3 - i * 0.025), 58, 0.34);
    for (let i = 0; i < 14; i++) click(0.5 + i * 0.075 + rnd(0, 0.03), 0.05 + i * 0.006);
    // The burst: a deep impact, air rushing out, and a bright chord ringing in the room.
    tone({ f: 140, to: 30, at: 1.6, dur: 1.5, gain: 0.55, attack: 0.004 });
    whoosh(240, 5200, 0.9, 1.6, 0.26, 0.6);
    pad([196, 261.6, 329.6, 392], 1.62, 2.6, 0.045, 2600);
    [392, 523.3, 659.3, 784, 1046.5].forEach((f, i) => bell(f, 1.64 + i * 0.045, 2.6, 0.085));
    sparkle(1568, 1.9, 7, 0.05);
  },
};

/* ---------- recorded samples ---------- */

/**
 * Real recordings live in /public/sfx/<id>.mp3 (see CREDITS.md there). They are
 * preferred; the synthesised voice above is only what you hear if a file is
 * missing or has not finished loading.
 */
const SAMPLE_IDS = [...Object.keys(SOUNDS), 'coins', 'knock', 'owlBump'];
const samples = new Map<string, AudioBuffer>();
const pending = new Map<string, Promise<void>>();

const load = (id: string): Promise<void> => {
  const known = pending.get(id);
  if (known) return known;
  const ac = audio();
  const job = !ac
    ? Promise.resolve()
    : fetch(`/sfx/${id}.mp3`)
      .then((res) => (res.ok && (res.headers.get('content-type') ?? '').includes('audio') ? res.arrayBuffer() : null))
      .then((data) => (data ? ac.decodeAudioData(data) : null))
      .then((buf) => {
        // A music loop that was dropped while it was still being decoded is let go at once.
        if (buf && (!isLoop(id) || pending.get(id) === job)) samples.set(id, buf);
      })
      .catch(() => { /* no recording for this one — the synth covers it */ });
  pending.set(id, job);
  return job;
};

/**
 * The two music loops are about 20 MB each once decoded, so only the one that is
 * playing is kept; the other is decoded again (a fraction of a second) when asked for.
 */
const isLoop = (id: string): boolean => id.startsWith('ambience-');
const dropLoop = (id: string): void => {
  samples.delete(id);
  pending.delete(id);
};

/** Fetches the recordings ahead of the first click. Safe to call more than once. */
export const preloadSounds = (): void => {
  if (!enabled) return;
  SAMPLE_IDS.forEach((id) => { void load(id); });
};

/** Clicks sit well under the background; only the book's own moments are allowed to be big. */
const LEVEL: Record<string, number> = { bookOpen: 0.75, bookClose: 0.5, page: 0.4, cvScroll: 0.45, engine: 0.32, knock: 0.7, owlBump: 0.9 };
const CLICK_LEVEL = 0.3;

const playSample = (id: string, at = 0, gain = LEVEL[id] ?? CLICK_LEVEL): boolean => {
  const buf = samples.get(id);
  if (!buf || !ctx || !bus) return false;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const level = ctx.createGain();
  level.gain.value = gain;
  src.connect(level).connect(bus);
  src.start(ctx.currentTime + at);
  return true;
};

/* ---------- background ---------- */

let ambience: { src: AudioBufferSourceNode; level: GainNode } | null = null;
let wantAmbience = false;
/** Which loop is the room's bed right now: the day tune, or the quieter one for lights-out. */
let track = 'ambience-day';
const AMBIENCE_LEVEL = 0.34;

/** Browsers keep audio suspended until the visitor interacts; start for real on the first touch. */
const unlock = (): void => {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
};

/** The room's own sound: a quiet looping bed under everything. */
export const startAmbience = (): void => {
  wantAmbience = true;
  if (!enabled || ambience) return;
  const ac = audio();
  if (!ac) return;
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  const wanted = track;
  void load(wanted).then(() => {
    const buf = samples.get(wanted);
    if (!buf || !master || ambience || !wantAmbience || !enabled || wanted !== track) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const level = ac.createGain();
    // Straight to the output: it already has its own space, and it should not pump the reverb.
    level.gain.setValueAtTime(0.0001, ac.currentTime);
    level.gain.exponentialRampToValueAtTime(AMBIENCE_LEVEL, ac.currentTime + 3);
    src.connect(level).connect(master);
    src.start();
    ambience = { src, level };
  });
};

const fadeOut = (): void => {
  wantAmbience = false;
  if (!ambience || !ctx) return;
  const { src, level } = ambience;
  ambience = null;
  level.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
  src.stop(ctx.currentTime + 1.2);
};

export const stopAmbience = (): void => {
  fadeOut();
  // Leaving the room: the music's memory goes with it (the playing source keeps it until it has faded).
  dropLoop(track);
};

/** Cross over to another loop (e.g. when the lights go out). Safe to call before anything plays. */
export const setAmbienceTrack = (id: string): void => {
  if (id === track) return;
  dropLoop(track);
  track = id;
  if (!wantAmbience) return;
  fadeOut();
  startAmbience();
};

/** The tab went to the background (or came back): no sound from a page nobody is looking at. */
export const setAudioAwake = (awake: boolean): void => {
  if (!ctx) return;
  if (awake) {
    // Coming back may itself not count as a gesture on a phone; the next tap finishes the job.
    if (enabled && ctx.state !== 'running') { void ctx.resume().catch(() => undefined); armUnlock(ctx); }
  } else if (ctx.state === 'running') {
    void ctx.suspend();
  }
};

/** Pull the background down while something else needs the room (the book being read). */
export const duckAmbience = (down: boolean): void => {
  if (ambience && ctx) ambience.level.gain.setTargetAtTime(down ? AMBIENCE_LEVEL * 0.45 : AMBIENCE_LEVEL, ctx.currentTime, 0.4);
};

export const play = (id: string): void => {
  if (!enabled) return;
  try {
    audio();
    if (bus && ctx) bus.gain.setTargetAtTime(1, ctx.currentTime, 0.01);
    if (playSample(id)) return;
    void load(id);
    if (bus && ctx) bus.gain.setTargetAtTime(id === 'bookOpen' ? 0.8 : 0.45, ctx.currentTime, 0.01);
    SOUNDS[id]?.();
  } catch { /* sound is a nicety; never let it break the scene */ }
};
