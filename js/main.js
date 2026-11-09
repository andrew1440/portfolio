import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createTrack, createWorld, LANE } from './world.js';
import { createRider } from './rider.js';
import { createAudio } from './audio.js';
import { RANGES, NAV, STATIONS, PROJECT_SPLITS, PROJECTS, CAMERA_KEYS, pToU } from './config.js';

const FONT_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json';
const $ = (s) => document.querySelector(s);
const UP = new THREE.Vector3(0, 1, 0);

$('#year').textContent = new Date().getFullYear();

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function loadFont(url) {
  return new Promise((resolve) => new FontLoader().load(url, resolve, undefined, () => resolve(null)));
}

function createRenderer() {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas: $('#scene'), antialias: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
    return renderer;
  } catch {
    return null;
  }
}

function buildMenu(onGo) {
  const list = $('#menuList');
  NAV.forEach((item, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.innerHTML = `<small>0${i + 1}</small>${item.label}`;
    btn.addEventListener('click', () => onGo(item.p));
    li.append(btn);
    list.append(li);
  });
  const stops = $('#progressStops');
  for (const item of NAV) {
    const s = document.createElement('span');
    s.style.left = `${item.p * 100}%`;
    stops.append(s);
  }
  return {
    buttons: [...list.querySelectorAll('button')],
    stops: [...stops.children],
  };
}

function sampleCamera(p) {
  let i = 0;
  while (i < CAMERA_KEYS.length - 2 && p > CAMERA_KEYS[i + 1].p) i++;
  const a = CAMERA_KEYS[i], b = CAMERA_KEYS[i + 1];
  const t = THREE.MathUtils.smoothstep(p, a.p, b.p);
  const out = {};
  for (const k of ['back', 'height', 'side', 'ahead', 'lookH', 'lookSide']) out[k] = (a[k] ?? 0) + ((b[k] ?? 0) - (a[k] ?? 0)) * t;
  return out;
}

async function main() {
  const renderer = createRenderer();
  if (!renderer) {
    document.documentElement.classList.add('no-webgl');
    document.querySelectorAll('.panel, .project').forEach((el) => el.classList.add('is-visible', 'is-active'));
    return;
  }

  // --- loading ---------------------------------------------------------------
  const fill = $('#loaderFill'), pct = $('#loaderPct');
  let done = 0;
  const TOTAL = 4;
  const tick = (v) => {
    done++;
    const n = Math.round((done / TOTAL) * 100);
    fill.style.width = `${n}%`;
    pct.textContent = n;
    return v;
  };
  const [font, image] = await Promise.all([
    withTimeout(loadFont(FONT_URL), 10000).then(tick),
    loadImage(PROJECTS[0].image).then(tick),
    withTimeout(Promise.all([
      document.fonts.load('400 64px "Zen Dots"'),
      document.fonts.load('500 34px "Inter"'),
    ]).catch(() => null), 6000).then(tick),
  ]);

  // --- renderer & scene ------------------------------------------------------
  const isSmall = innerWidth <= 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.5 : 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isSmall ? 62 : 50, innerWidth / innerHeight, 0.2, 3000);

  const track = createTrack();
  const world = createWorld(scene, track, { font, image });
  const rider = createRider(scene, track);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.5, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Upload textures/shaders before the reveal so the first frame doesn't hitch.
  renderer.compile(scene, camera);
  tick();

  // --- state -----------------------------------------------------------------
  let started = false;
  let target = 0;
  let progress = 0;
  const audio = createAudio();
  const soundBtn = $('#soundBtn');
  const setSound = (on) => soundBtn.setAttribute('aria-pressed', String(audio.set(on)));
  soundBtn.addEventListener('click', () => setSound(!audio.on));

  const go = (p) => {
    target = THREE.MathUtils.clamp(p, 0, 1);
    setMenu(false);
  };
  const nav = buildMenu(go);
  document.querySelectorAll('[data-p]').forEach((el) =>
    el.addEventListener('click', (e) => {
      e.preventDefault();
      go(Number(el.dataset.p));
    }));

  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('#menu').setAttribute('aria-hidden', String(!open));
    $('#menu').inert = !open;
    $('.panels').inert = open;
    if (open) nav.buttons[0].focus();
    else if ($('#menu').contains(document.activeElement)) menuBtn.focus();
  }
  menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));

  const start = (withSound) => {
    if (started) return;
    started = true;
    $('#loader').classList.add('is-hidden');
    setSound(withSound);
  };
  const startBtn = $('#startBtn'), muteBtn = $('#startMuted');
  startBtn.disabled = muteBtn.disabled = false;
  startBtn.textContent = 'Start';
  startBtn.addEventListener('click', () => start(true));
  muteBtn.addEventListener('click', () => start(false));

  // --- input -----------------------------------------------------------------
  const nudge = (d) => {
    if (started && !document.body.classList.contains('menu-open')) {
      target = THREE.MathUtils.clamp(target + d, 0, 1);
    }
  };
  const scrollable = (el) => {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflowY === 'auto') return true;
    }
    return false;
  };
  addEventListener('wheel', (e) => {
    if (scrollable(e.target)) return;
    const px = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    nudge(THREE.MathUtils.clamp(px, -150, 150) * 0.00011);
  }, { passive: true });

  let touchY = null;
  addEventListener('touchstart', (e) => {
    touchY = scrollable(e.target) ? null : e.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (touchY === null) return;
    const y = e.touches[0].clientY;
    nudge((touchY - y) * 0.00045);
    touchY = y;
  }, { passive: true });
  const resetTouch = () => { touchY = null; };
  addEventListener('touchend', resetTouch, { passive: true });
  addEventListener('touchcancel', resetTouch, { passive: true });

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
    if (!started || document.body.classList.contains('menu-open') || scrollable(e.target)) return;
    const k = { ArrowDown: 0.02, ArrowUp: -0.02, PageDown: 0.08, PageUp: -0.08, ' ': 0.05 }[e.key];
    if (k !== undefined && !(e.key === ' ' && e.target.closest('button, a'))) {
      e.preventDefault();
      nudge(e.shiftKey && e.key === ' ' ? -k : k);
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      go(e.key === 'Home' ? 0 : 1);
    }
  });

  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let hovered = null;
  addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  });
  $('#scene').addEventListener('click', (e) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(world.clickables, false)[0];
    if (hit) window.open(hit.object.userData.url, '_blank', 'noopener');
  });

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = innerWidth <= 760 ? 62 : 50;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
  });

  // --- UI sync ---------------------------------------------------------------
  const panels = Object.fromEntries([...document.querySelectorAll('[data-panel]')].map((el) => [el.dataset.panel, el]));
  const skillEls = [...document.querySelectorAll('.skill')];
  const projectEls = [...document.querySelectorAll('.project')];
  const progressFill = $('#progressFill');
  const scrollHint = $('#scrollHint');

  function syncUI(p) {
    for (const [id, [a, b]] of Object.entries(RANGES)) {
      panels[id]?.classList.toggle('is-visible', started && p >= a && p <= b);
    }
    let nearest = 0;
    STATIONS.skills.forEach((s, i) => {
      if (Math.abs(p - s) < Math.abs(p - STATIONS.skills[nearest])) nearest = i;
    });
    skillEls.forEach((el, i) => el.classList.toggle('is-active', i === nearest));
    const proj = PROJECT_SPLITS.filter((s) => p >= s).length;
    projectEls.forEach((el, i) => el.classList.toggle('is-active', i === proj));

    let navIdx = 0;
    NAV.forEach((n, i) => {
      if (p >= n.p - 0.03) navIdx = i;
    });
    nav.buttons.forEach((b, i) => b.classList.toggle('is-active', i === navIdx));
    nav.stops.forEach((s, i) => s.classList.toggle('is-passed', p >= NAV[i].p - 0.005));
    progressFill.style.width = `${p * 100}%`;
    scrollHint.classList.toggle('is-hidden', !started || p > 0.02);
  }

  // --- frame loop ------------------------------------------------------------
  const clock = new THREE.Clock();
  const fCam = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
  const fLook = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
  const camPos = new THREE.Vector3(), lookPos = new THREE.Vector3();
  const camSmooth = new THREE.Vector3(), lookSmooth = new THREE.Vector3();
  let firstFrame = true;

  function placeCamera(p, dt) {
    const u = pToU(p);
    const k = sampleCamera(p);
    const framing = Math.min(1, camera.aspect / 1.2);
    k.side *= framing;
    k.lookSide *= framing;
    track.frame(u - k.back / track.length, fCam);
    track.frame(u + k.ahead / track.length, fLook);
    parallax.lerp(pointer.x > 5 ? new THREE.Vector2() : pointer, 1 - Math.exp(-dt * 3));
    camPos.copy(fCam.pos)
      .addScaledVector(fCam.right, -LANE + k.side + parallax.x * 0.8)
      .addScaledVector(UP, k.height + parallax.y * 0.4);
    lookPos.copy(fLook.pos).addScaledVector(fLook.right, -LANE + k.lookSide).addScaledVector(UP, k.lookH);
    if (firstFrame) {
      camSmooth.copy(camPos);
      lookSmooth.copy(lookPos);
      firstFrame = false;
    }
    const s = 1 - Math.exp(-dt * 8);
    camSmooth.lerp(camPos, s);
    lookSmooth.lerp(lookPos, s);
    camera.position.copy(camSmooth);
    camera.lookAt(lookSmooth);
  }

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;
    progress += (target - progress) * (1 - Math.exp(-dt * 2.6));
    if (Math.abs(target - progress) < 1e-5) progress = target;

    const speed = rider.update(pToU(progress), dt, time);
    audio.setSpeed(speed);
    placeCamera(progress, dt);
    world.update(dt, time, rider.position, camera);

    raycaster.setFromCamera(pointer, camera);
    const hit = started && pointer.x < 5 ? raycaster.intersectObjects(world.clickables, false)[0] : null;
    const h = hit ? hit.object : null;
    if (h !== hovered) {
      hovered = h;
      world.setHover(h);
      document.body.classList.toggle('is-hovering', !!h);
    }

    syncUI(progress);
    composer.render(dt);
  });
}

await main();
