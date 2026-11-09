// Procedural soundscape: distant city hum plus a boda-boda engine that revs with scroll speed.
export function createAudio() {
  let ctx = null;
  let master, engineGain, engineOsc, engineSub, engineFilter;
  let on = false;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const hum = ctx.createBufferSource();
    hum.buffer = buf;
    hum.loop = true;
    const humFilter = ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.value = 420;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.35;
    hum.connect(humFilter).connect(humGain).connect(master);
    hum.start();

    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineSub = ctx.createOscillator();
    engineSub.type = 'square';
    engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.Q.value = 4;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0.02;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.5;
    engineOsc.connect(engineFilter);
    engineSub.connect(subGain).connect(engineFilter);
    engineFilter.connect(engineGain).connect(master);
    engineOsc.start();
    engineSub.start();
    setSpeed(0);
  }

  function setSpeed(speed) {
    if (!ctx) return;
    const s = Math.min(1, Math.abs(speed) / 30);
    const t = ctx.currentTime;
    const base = 38 + s * 90;
    engineOsc.frequency.setTargetAtTime(base, t, 0.12);
    engineSub.frequency.setTargetAtTime(base / 2, t, 0.12);
    engineFilter.frequency.setTargetAtTime(260 + s * 1300, t, 0.12);
    engineGain.gain.setTargetAtTime(0.03 + s * 0.09, t, 0.15);
  }

  function set(value) {
    on = value;
    if (on && !ctx) init();
    if (!ctx) return on;
    if (on) ctx.resume();
    master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.3);
    return on;
  }

  return {
    get on() {
      return on;
    },
    set,
    toggle: () => set(!on),
    setSpeed,
  };
}
