import * as THREE from 'three';

const DISPLAY = '"Zen Dots", system-ui, sans-serif';
const BODY = '"Inter", system-ui, sans-serif';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(canvas, { repeat = true, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const WARM = ['#ffd08a', '#ffb35c', '#fff1cf', '#ffc46e'];

// 8x8 grid of window cells; one cell = one bay x one floor.
export function facadeTextures(rand) {
  const N = 8, S = 64, W = N * S;
  const [c, g] = makeCanvas(W, W);
  const [e, ge] = makeCanvas(W, W);
  g.fillStyle = '#efe8dd';
  g.fillRect(0, 0, W, W);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, W);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = i * S, y = j * S;
      g.fillStyle = '#d9d0c2';
      g.fillRect(x, y + S - 7, S, 7);
      const grad = g.createLinearGradient(0, y + 12, 0, y + S - 14);
      grad.addColorStop(0, '#3a4660');
      grad.addColorStop(1, '#1d2433');
      g.fillStyle = grad;
      g.fillRect(x + 15, y + 12, S - 30, S - 26);
      g.fillStyle = 'rgba(255,255,255,0.12)';
      g.fillRect(x + 15, y + 12, S - 30, 3);
      if (rand() < 0.36) {
        ge.fillStyle = WARM[Math.floor(rand() * WARM.length)];
        ge.globalAlpha = 0.55 + rand() * 0.45;
        ge.fillRect(x + 15, y + 12, S - 30, S - 26);
        ge.globalAlpha = 1;
      }
    }
  }
  return { map: toTexture(c), emissiveMap: toTexture(e) };
}

export function glassTextures(rand) {
  const N = 8, S = 64, W = N * S;
  const [c, g] = makeCanvas(W, W);
  const [e, ge] = makeCanvas(W, W);
  const grad = g.createLinearGradient(0, 0, W, W);
  grad.addColorStop(0, '#9fb1c9');
  grad.addColorStop(1, '#6f819c');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, W);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, W);
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = i * S, y = j * S;
      g.fillStyle = 'rgba(20,28,44,0.55)';
      g.fillRect(x + 3, y + 4, S - 6, S - 12);
      if (rand() < 0.3) {
        ge.fillStyle = WARM[Math.floor(rand() * WARM.length)];
        ge.globalAlpha = 0.35 + rand() * 0.5;
        ge.fillRect(x + 3, y + 4, S - 6, S - 12);
        ge.globalAlpha = 1;
      }
    }
    g.fillStyle = 'rgba(230,236,245,0.5)';
    g.fillRect(i * S, 0, 2, W);
  }
  return { map: toTexture(c), emissiveMap: toTexture(e) };
}

// Vertical fins + window slots, loosely after the KICC tower facade.
export function kiccTextures(rand) {
  const W = 256, H = 256;
  const [c, g] = makeCanvas(W, H);
  const [e, ge] = makeCanvas(W, H);
  g.fillStyle = '#dcc9a6';
  g.fillRect(0, 0, W, H);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, W, H);
  const cols = 8, rows = 8, cw = W / cols, rh = H / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      g.fillStyle = '#2a2f3d';
      g.fillRect(i * cw + 9, j * rh + 8, cw - 18, rh - 16);
      if (rand() < 0.4) {
        ge.fillStyle = WARM[Math.floor(rand() * WARM.length)];
        ge.fillRect(i * cw + 9, j * rh + 8, cw - 18, rh - 16);
      }
    }
    g.fillStyle = '#c2ae8a';
    g.fillRect(i * cw, 0, 6, H);
  }
  return { map: toTexture(c), emissiveMap: toTexture(e) };
}

export function roadTexture() {
  const W = 256, H = 512;
  const [c, g] = makeCanvas(W, H);
  g.fillStyle = '#3b3a40';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const v = 40 + Math.random() * 40;
    g.fillStyle = `rgba(${v},${v},${v + 6},0.5)`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  g.fillStyle = '#e9e4d8';
  g.fillRect(12, 0, 6, H);
  g.fillRect(W - 18, 0, 6, H);
  g.fillStyle = '#f2c94c';
  g.fillRect(W / 2 - 4, 0, 8, H * 0.5);
  return toTexture(c);
}

export function labelTexture(text, color) {
  const [c, g] = makeCanvas(1024, 256);
  g.font = `400 92px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.shadowColor = color;
  g.shadowBlur = 36;
  g.fillStyle = '#fff';
  g.fillText(text.toUpperCase(), 512, 128);
  g.shadowBlur = 0;
  g.fillText(text.toUpperCase(), 512, 128);
  return toTexture(c, { repeat: false });
}

function drawCover(g, img, w, h) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  g.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
}

function drawSportsArt(g, w, h) {
  g.fillStyle = '#1d6b3c';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    if (i % 2) continue;
    g.fillStyle = 'rgba(255,255,255,0.05)';
    g.fillRect((i * w) / 10, 0, w / 10, h);
  }
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 5;
  g.strokeRect(60, 60, w - 120, h - 120);
  g.beginPath();
  g.moveTo(w / 2, 60);
  g.lineTo(w / 2, h - 60);
  g.stroke();
  g.beginPath();
  g.arc(w / 2, h / 2, 90, 0, Math.PI * 2);
  g.stroke();
  g.strokeRect(60, h / 2 - 140, 150, 280);
  g.strokeRect(w - 210, h / 2 - 140, 150, 280);
  const players = [
    [300, 220], [380, 470], [520, 300], [690, 210], [760, 470], [930, 330], [1010, 520], [450, 600],
  ];
  g.strokeStyle = 'rgba(255,170,90,0.75)';
  g.lineWidth = 3;
  g.beginPath();
  players.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
  players.forEach(([x, y]) => {
    g.fillStyle = '#ff7a3d';
    g.beginPath();
    g.arc(x, y, 16, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = 'rgba(255,122,61,0.35)';
    g.lineWidth = 10;
    g.beginPath();
    g.arc(x, y, 34, 0, Math.PI * 2);
    g.stroke();
  });
}

function drawCodeArt(g, w, h) {
  g.fillStyle = '#12131b';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#1c1e2a';
  g.fillRect(50, 50, w - 100, h - 100);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(90 + i * 34, 86, 10, 0, Math.PI * 2);
    g.fill();
  });
  const palette = ['#c792ea', '#82aaff', '#c3e88d', '#f78c6c', '#89ddff'];
  for (let i = 0; i < 14; i++) {
    let x = 90 + (i % 4 === 0 ? 0 : 40);
    const y = 140 + i * 36;
    const parts = 1 + ((i * 7) % 4);
    for (let k = 0; k < parts; k++) {
      const len = 40 + ((i * 31 + k * 17) % 120);
      g.fillStyle = palette[(i + k) % palette.length];
      g.globalAlpha = 0.85;
      g.fillRect(x, y, len, 14);
      x += len + 14;
    }
  }
  g.globalAlpha = 1;
  const px = w * 0.56, py = 120, pw = w * 0.36, ph = h - 220;
  g.fillStyle = '#f6f2ec';
  g.fillRect(px, py, pw, ph);
  g.fillStyle = '#ff7a3d';
  g.fillRect(px + 30, py + 30, pw * 0.5, 28);
  g.fillStyle = '#d8d2c8';
  g.fillRect(px + 30, py + 80, pw - 60, 14);
  g.fillRect(px + 30, py + 106, pw - 120, 14);
  g.fillStyle = '#1c1e2a';
  g.fillRect(px + 30, py + ph - 90, 150, 50);
  g.fillStyle = '#37c47b';
  g.fillRect(px + 200, py + ph - 90, 150, 50);
}

function drawAiArt(g, w, h) {
  g.fillStyle = '#0d0b1f';
  g.fillRect(0, 0, w, h);
  const nodes = Array.from({ length: 40 }, (_, i) => [
    (Math.sin(i * 12.9898) * 0.5 + 0.5) * w,
    (Math.sin(i * 78.233) * 0.5 + 0.5) * h,
  ]);
  g.strokeStyle = 'rgba(120,200,255,0.25)';
  nodes.forEach(([x, y], i) => {
    const [x2, y2] = nodes[(i * 7 + 3) % nodes.length];
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x2, y2);
    g.stroke();
  });
  nodes.forEach(([x, y]) => {
    g.fillStyle = '#8fd8ff';
    g.beginPath();
    g.arc(x, y, 6, 0, Math.PI * 2);
    g.fill();
  });
}

export function projectTexture(project, image) {
  const w = 1280, h = 720;
  const [c, g] = makeCanvas(w, h);
  if (image) drawCover(g, image, w, h);
  else if (project.art === 'sports') drawSportsArt(g, w, h);
  else if (project.art === 'code') drawCodeArt(g, w, h);
  else drawAiArt(g, w, h);

  const shade = g.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, 'rgba(10,8,14,0.15)');
  shade.addColorStop(0.45, 'rgba(10,8,14,0.35)');
  shade.addColorStop(1, 'rgba(10,8,14,0.92)');
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);

  g.textBaseline = 'alphabetic';
  g.fillStyle = '#ff7a3d';
  g.font = `400 30px ${DISPLAY}`;
  g.fillText(project.tag.toUpperCase(), 64, h - 250);
  g.fillStyle = '#fff';
  g.font = `400 104px ${DISPLAY}`;
  g.fillText(project.title, 60, h - 140, w - 120);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.font = `500 34px ${BODY}`;
  g.fillText(project.stack, 64, h - 78);
  g.textAlign = 'right';
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.font = `400 120px ${DISPLAY}`;
  g.globalAlpha = 0.25;
  g.fillText(project.index, w - 50, 140);
  g.globalAlpha = 1;
  g.font = `400 24px ${DISPLAY}`;
  g.fillText('CLICK TO OPEN  \u2197', w - 60, h - 78);
  const t = toTexture(c, { repeat: false });
  return t;
}
