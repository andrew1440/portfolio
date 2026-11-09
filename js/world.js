import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { facadeTextures, glassTextures, kiccTextures, roadTexture, labelTexture, projectTexture } from './textures.js';
import { STATIONS, SKILLS, PROJECTS, pToU } from './config.js';

const UP = new THREE.Vector3(0, 1, 0);
export const ROAD_HALF = 5;
// Kenya drives on the left: the rider keeps left, matatus come the other way.
export const LANE = 2.5;

export function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTrack() {
  const pts = [
    [0, 0], [0, -70], [28, -140], [22, -215], [-18, -280], [-32, -360], [-6, -430],
    [36, -490], [44, -570], [18, -640], [-10, -710], [-4, -790], [10, -860],
  ].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  curve.arcLengthDivisions = 2000;
  const length = curve.getLength();

  function frame(u, out = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() }) {
    const uc = THREE.MathUtils.clamp(u, 0, 1);
    curve.getPointAt(uc, out.pos);
    curve.getTangentAt(uc, out.tan);
    if (u !== uc) out.pos.addScaledVector(out.tan, (u - uc) * length);
    out.right.crossVectors(out.tan, UP).normalize();
    return out;
  }
  return { curve, length, frame };
}

const yawOf = (dir) => Math.atan2(dir.x, dir.z);

function placeAt(track, p, side, offset) {
  const f = track.frame(pToU(p));
  return {
    pos: f.pos.clone().addScaledVector(f.right, side * offset),
    tan: f.tan.clone(),
    right: f.right.clone(),
  };
}

class Bucket {
  constructor() {
    this.position = [];
    this.normal = [];
    this.uv = [];
    this.color = [];
  }

  // a,b,c,d = bottom-left, bottom-right, top-right, top-left as seen from the front.
  quad(a, b, c, d, uvs, color, facing) {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a)).normalize();
    if (n.dot(facing) < 0) {
      [b, d] = [d, b];
      uvs = [uvs[0], uvs[3], uvs[2], uvs[1]];
      n.negate();
    }
    for (const [p, t] of [[a, uvs[0]], [b, uvs[1]], [c, uvs[2]], [a, uvs[0]], [c, uvs[2]], [d, uvs[3]]]) {
      this.position.push(p.x, p.y, p.z);
      this.normal.push(n.x, n.y, n.z);
      this.uv.push(t[0], t[1]);
      this.color.push(color.r, color.g, color.b);
    }
  }

  build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.position, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.normal, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.color, 3));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, material);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
}

const ZERO_UV = [[0, 0], [0, 0], [0, 0], [0, 0]];

function addBox(walls, roofs, center, axis, w, d, h, color, rand, base = 0) {
  const side = new THREE.Vector3().crossVectors(axis, UP);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sa, sb]) =>
    center.clone().addScaledVector(axis, (sa * w) / 2).addScaledVector(side, (sb * d) / 2).setY(base));
  const u0 = Math.floor(rand() * 8) / 8;
  const v0 = Math.floor(rand() * 8) / 8;
  const vSpan = Math.max(1, Math.round((h - base) / 3.5)) / 8;
  for (let i = 0; i < 4; i++) {
    const A = corners[i], B = corners[(i + 1) % 4];
    const uSpan = Math.max(1, Math.round(A.distanceTo(B) / 3)) / 8;
    const facing = A.clone().add(B).multiplyScalar(0.5).sub(center).setY(0);
    walls.quad(A, B, B.clone().setY(h), A.clone().setY(h),
      [[u0, v0], [u0 + uSpan, v0], [u0 + uSpan, v0 + vSpan], [u0, v0 + vSpan]], color, facing);
  }
  const top = corners.map((c) => c.clone().setY(h));
  roofs.quad(top[0], top[1], top[2], top[3], ZERO_UV, color.clone().multiplyScalar(0.55), UP);
}

const TAIL = -0.12;

function ribbon(track, offA, offB, y, vScale, material) {
  const segs = Math.ceil((track.length * (1 - TAIL)) / 2);
  const pos = [], uv = [], idx = [];
  const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
  for (let i = 0; i <= segs; i++) {
    const u = TAIL + ((1 - TAIL) * i) / segs;
    track.frame(u, f);
    const a = f.pos.clone().addScaledVector(f.right, offA);
    const b = f.pos.clone().addScaledVector(f.right, offB);
    pos.push(a.x, y, a.z, b.x, y, b.z);
    const v = (u * track.length) / vScale;
    uv.push(0, v, 1, v);
    if (i < segs) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.receiveShadow = true;
  return m;
}

function groundTexture() {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#9c7656';
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * S, y = Math.random() * S, r = 10 + Math.random() * 50;
    g.fillStyle = Math.random() < 0.55 ? 'rgba(96,112,52,0.35)' : 'rgba(150,92,60,0.3)';
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      g.beginPath();
      g.arc(x + ox, y + oy, r, 0, Math.PI * 2);
      g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(60, 60);
  t.anisotropy = 8;
  return t;
}

function makeSky(sunDir, horizon) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTop: { value: new THREE.Color('#2a2552') },
      uMid: { value: new THREE.Color('#c8607a') },
      uHorizon: { value: horizon },
      uSun: { value: sunDir },
      uSunColor: { value: new THREE.Color('#fff0c8') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uMid, uHorizon, uSun, uSunColor;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.2, h));
        col = mix(col, uTop, smoothstep(0.18, 0.7, h));
        col = mix(uHorizon * 0.92, col, smoothstep(-0.1, 0.0, h));
        float s = max(dot(d, normalize(uSun)), 0.0);
        col += uSunColor * (pow(s, 1200.0) * 8.0 + pow(s, 28.0) * 0.5 + pow(s, 4.0) * 0.14);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), material);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}

function text3d(font, str, size, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.1,
    emissive: color,
    emissiveIntensity: 0.18,
  });
  if (!font) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size * str.length * 0.9, size * str.length * 0.225),
      new THREE.MeshBasicMaterial({ map: labelTexture(str, color), transparent: true, side: THREE.DoubleSide }),
    );
    plane.position.y = size * 0.6;
    return plane;
  }
  const depth = size * 0.32;
  const geo = new TextGeometry(str, {
    font,
    size,
    depth,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: size * 0.04,
    bevelSize: size * 0.03,
    bevelSegments: 2,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -depth / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function makeMatatu(body, accent) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: body, roughness: 0.4, metalness: 0.2 });
  const stripe = new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: '#1a2030', roughness: 0.1, metalness: 0.6 });
  const dark = new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.9 });
  const head = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d0').multiplyScalar(5), toneMapped: false });
  const tail = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2020').multiplyScalar(4), toneMapped: false });
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(2.2, 1.9, 5.6), paint, 0, 1.45, 0);
  add(new THREE.BoxGeometry(2.24, 0.32, 5.64), stripe, 0, 1.05, 0);
  add(new THREE.BoxGeometry(2.25, 0.62, 4.3), glass, 0, 1.95, -0.3);
  add(new THREE.BoxGeometry(2.0, 0.7, 0.06), glass, 0, 1.9, 2.8);
  add(new THREE.BoxGeometry(2.0, 0.14, 4.0), dark, 0, 2.47, -0.2);
  const wheel = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14).rotateZ(Math.PI / 2);
  for (const x of [-0.98, 0.98]) for (const z of [-1.8, 1.8]) add(wheel, dark, x, 0.42, z);
  for (const x of [-0.75, 0.75]) {
    add(new THREE.BoxGeometry(0.34, 0.18, 0.06), head, x, 0.95, 2.82);
    add(new THREE.BoxGeometry(0.3, 0.2, 0.06), tail, x, 1.1, -2.82);
  }
  return g;
}

export function createWorld(scene, track, { font, image }) {
  const rand = rng(1440);
  const world = new THREE.Group();
  scene.add(world);
  const animated = [];
  const clickables = [];
  const occupied = [];
  const end = track.frame(1);

  const horizon = new THREE.Color('#f3a37a');
  scene.background = horizon.clone();
  scene.fog = new THREE.Fog(horizon, 70, 470);
  const sunDir = new THREE.Vector3(-0.55, 0.2, -0.8).normalize();
  const sky = makeSky(sunDir, horizon);
  world.add(sky);

  const hemi = new THREE.HemisphereLight('#ffd2b0', '#4a3a5c', 1.35);
  const sun = new THREE.DirectionalLight('#ffb27a', 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 280 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  world.add(hemi, sun, sun.target);

  // --- ground & roads ------------------------------------------------------
  const mid = track.curve.getPointAt(0.5);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }),
  );
  ground.position.set(mid.x, -0.02, mid.z);
  ground.receiveShadow = true;
  world.add(ground);

  world.add(ribbon(track, -ROAD_HALF, ROAD_HALF, 0.02, 10,
    new THREE.MeshStandardMaterial({ map: roadTexture(), roughness: 0.85 })));
  const walk = new THREE.MeshStandardMaterial({ color: '#b7aa9a', roughness: 0.95 });
  const verge = new THREE.MeshStandardMaterial({ color: '#6d7a3c', roughness: 1 });
  world.add(ribbon(track, -8, -ROAD_HALF, 0.14, 10, walk), ribbon(track, ROAD_HALF, 8, 0.14, 10, walk));
  world.add(ribbon(track, -13, -8, 0.06, 10, verge), ribbon(track, 8, 13, 0.06, 10, verge));

  const plazaCenter = end.pos.clone().addScaledVector(end.tan, 14);
  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(26, 64).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: '#c9b8a3', roughness: 0.9 }),
  );
  plaza.position.copy(plazaCenter).setY(0.08);
  plaza.receiveShadow = true;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(17, 18, 64).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a3d').multiplyScalar(1.6), toneMapped: false }),
  );
  ring.position.copy(plazaCenter).setY(0.1);
  world.add(plaza, ring);
  occupied.push({ x: plazaCenter.x, z: plazaCenter.z, r: 28 });

  // --- collision helpers ---------------------------------------------------
  const samples = Array.from({ length: 700 }, (_, i) => track.curve.getPointAt(i / 699));
  const clearOfOccupied = (x, z, r) =>
    occupied.every((o) => (o.x - x) ** 2 + (o.z - z) ** 2 >= (r + o.r) ** 2);
  const free = (x, z, r, gap = ROAD_HALF + 4) =>
    samples.every((s) => (s.x - x) ** 2 + (s.z - z) ** 2 >= (r + gap) ** 2) && clearOfOccupied(x, z, r);

  // --- buildings -----------------------------------------------------------
  const facade = facadeTextures(rand);
  const glassTex = glassTextures(rand);
  const facadeB = new Bucket(), glassB = new Bucket(), roofB = new Bucket();
  const tints = ['#f2e6d4', '#e9d3bd', '#f0c9a8', '#d9c2a5', '#f4ddc8', '#e6b89c', '#cfd6dc'].map((c) => new THREE.Color(c));
  const glassTints = ['#c9d6e8', '#a9c0dc', '#d6dbe6', '#9fc5c8'].map((c) => new THREE.Color(c));
  const beacons = [];

  function tower(center, axis, w, d, h) {
    const tint = glassTints[Math.floor(rand() * glassTints.length)];
    addBox(glassB, roofB, center, axis, w, d, h, tint, rand);
    addBox(glassB, roofB, center, axis, w * 0.62, d * 0.62, h * 1.08, tint, rand, h);
    beacons.push(center.clone().setY(h * 1.08 + 0.6));
  }

  // Downtown landmarks around the final plaza.
  const E = end.pos, T = end.tan, R = end.right;
  const at = (ahead, side) => E.clone().addScaledVector(T, ahead).addScaledVector(R, side);
  const kiccPos = at(85, -30);
  occupied.push({ x: kiccPos.x, z: kiccPos.z, r: 30 });
  for (const [ahead, side, w, h] of [[110, 35, 14, 140], [150, -75, 16, 95], [60, 70, 14, 80], [175, 10, 18, 115], [135, -10, 12, 72], [95, 100, 15, 100]]) {
    const c = at(ahead, side);
    occupied.push({ x: c.x, z: c.z, r: w * 0.8 });
    tower(c, T, w, w, h);
  }

  STATIONS.skills.forEach((p, i) => {
    const { pos } = placeAt(track, p, i % 2 ? -1 : 1, 10);
    occupied.push({ x: pos.x, z: pos.z, r: 3 });
  });
  const projectSites = STATIONS.projects.map((p) => placeAt(track, p, 1, 14).pos);
  for (const pos of projectSites) {
    occupied.push({ x: pos.x, z: pos.z, r: 9 });
  }

  const step = 10 / track.length;
  for (let u = TAIL * 0.85; u <= 1; u += step) {
    const f = track.frame(u);
    const downtown = THREE.MathUtils.smoothstep(u, 0.7, 1);
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        if (rand() < 0.18) continue;
        const w = 8 + rand() * 8, d = 8 + rand() * 8;
        const h = [7 + rand() * 10, 14 + rand() * 22, 30 + rand() * 45, 45 + rand() * 60][row] * (1 + downtown * 1.1);
        const c = f.pos.clone()
          .addScaledVector(f.right, side * (18 + row * 20 + rand() * 5))
          .addScaledVector(f.tan, (rand() - 0.5) * 4);
        const r = Math.hypot(w, d) / 2;
        if (!free(c.x, c.z, r)) continue;
        occupied.push({ x: c.x, z: c.z, r });
        if (row >= 2 || (h > 34 && rand() < 0.6)) tower(c, f.tan, w, d, h);
        else addBox(facadeB, roofB, c, f.tan, w, d, h, tints[Math.floor(rand() * tints.length)], rand);
      }
    }
  }

  world.add(
    facadeB.build(new THREE.MeshStandardMaterial({
      map: facade.map, emissiveMap: facade.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.0,
      vertexColors: true, roughness: 0.85,
    })),
    glassB.build(new THREE.MeshStandardMaterial({
      map: glassTex.map, emissiveMap: glassTex.emissiveMap, emissive: '#ffffff', emissiveIntensity: 0.9,
      vertexColors: true, roughness: 0.25, metalness: 0.55,
    })),
    roofB.build(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 })),
  );

  const beaconMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.5, 8, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3030').multiplyScalar(5), toneMapped: false }),
    beacons.length,
  );
  const dummy = new THREE.Object3D();
  beacons.forEach((b, i) => {
    dummy.position.copy(b);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    beaconMesh.setMatrixAt(i, dummy.matrix);
  });
  world.add(beaconMesh);
  animated.push((t) => {
    beaconMesh.material.color.setRGB(5, 0.3, 0.3).multiplyScalar(0.25 + 0.75 * (Math.sin(t * 3) > 0 ? 1 : 0.15));
  });

  // KICC: cylindrical tower with saucer crown, plus the cone-roofed amphitheatre.
  {
    const kicc = new THREE.Group();
    kicc.position.copy(kiccPos);
    const tex = kiccTextures(rand);
    tex.map.repeat.set(3, 4);
    tex.emissiveMap.repeat.set(3, 4);
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 6.4, 105, 32),
      new THREE.MeshStandardMaterial({ map: tex.map, emissiveMap: tex.emissiveMap, emissive: '#ffffff', emissiveIntensity: 1.4, roughness: 0.7 }),
    );
    shaft.position.y = 52.5;
    const stone = new THREE.MeshStandardMaterial({ color: '#cbb08c', roughness: 0.8 });
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 7, 3.2, 40), stone);
    crown.position.y = 106.6;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(4, 5, 2.4, 24), stone);
    cap.position.y = 109.4;
    const terracotta = new THREE.MeshStandardMaterial({ color: '#a5532f', roughness: 0.9 });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 5, 32), stone);
    drum.position.set(-22, 2.5, 6);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 15.5, 10, 32), terracotta);
    cone.position.set(-22, 10, 6);
    for (const m of [shaft, crown, cap, drum, cone]) {
      m.castShadow = m.receiveShadow = true;
      kicc.add(m);
    }
    world.add(kicc);
  }

  // Ngong Hills on the horizon.
  {
    const near = new THREE.MeshBasicMaterial({ color: '#a06a7c', fog: false });
    const far = new THREE.MeshBasicMaterial({ color: '#c98a8c', fog: false });
    const hill = new THREE.SphereGeometry(1, 24, 12);
    for (const [ahead, side, sx, sy, sz, mat] of [
      [1250, -500, 420, 120, 180, far], [1300, 100, 520, 150, 200, far], [1200, 650, 380, 110, 170, far],
      [1050, -200, 300, 85, 140, near], [1080, 330, 340, 95, 150, near], [1000, 850, 260, 70, 130, near],
    ]) {
      const m = new THREE.Mesh(hill, mat);
      m.position.copy(at(ahead, side)).setY(-sy * 0.35);
      m.scale.set(sx, sy, sz);
      m.rotation.y = yawOf(T);
      world.add(m);
    }
  }

  // --- stations ------------------------------------------------------------
  function standingText(str, p, side, offset, size, color) {
    const { pos, tan, right } = placeAt(track, p, side, offset);
    const mesh = text3d(font, str, size, color);
    mesh.position.add(pos);
    const facing = tan.clone().multiplyScalar(-0.6).addScaledVector(right, -0.8 * side).normalize();
    mesh.rotation.y = yawOf(facing);
    world.add(mesh);
    occupied.push({ x: pos.x, z: pos.z, r: size * str.length * 0.42 });
  }
  standingText('KARIBU', 0.045, -1, 15, 3.2, '#f2c94c');
  standingText('ABOUT ME', STATIONS.about, 1, 15, 2.8, '#d0463b');
  standingText('PROJECTS', STATIONS.projectsTitle, 1, 15, 2.8, '#ff7a3d');
  {
    const talk = text3d(font, "LET'S TALK", 3, '#ff7a3d');
    talk.position.add(plazaCenter);
    talk.rotation.y = yawOf(T.clone().negate());
    world.add(talk);
  }

  // Skill Zone gate.
  {
    const { pos, tan, right } = placeAt(track, STATIONS.gate, 1, 0);
    const gate = new THREE.Group();
    gate.position.copy(pos);
    gate.rotation.y = yawOf(tan.clone().negate());
    const dark = new THREE.MeshStandardMaterial({ color: '#23202b', roughness: 0.6, metalness: 0.3 });
    const neon = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7a3d').multiplyScalar(1.4), toneMapped: false });
    for (const x of [-7.6, 7.6]) {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 10, 1.2), dark);
      pillar.position.set(x, 5, 0);
      pillar.castShadow = true;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 9, 1.24), neon);
      strip.position.set(x - Math.sign(x) * 0.62, 4.5, 0);
      gate.add(pillar, strip);
      const p = pos.clone().addScaledVector(right, x);
      occupied.push({ x: p.x, z: p.z, r: 1.5 });
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16.4, 2.8, 1.2), dark);
    beam.position.y = 10.6;
    beam.castShadow = true;
    const edge = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.14, 1.26), neon);
    edge.position.y = 9.2;
    const sign = labelTexture('SKILL ZONE', '#ff7a3d');
    for (const [z, ry] of [[0.62, 0], [-0.62, Math.PI]]) {
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 3.5),
        new THREE.MeshBasicMaterial({ map: sign, transparent: true, depthWrite: false }),
      );
      plane.position.set(0, 10.6, z);
      plane.rotation.y = ry;
      gate.add(plane);
    }
    gate.add(beam, edge);
    world.add(gate);
  }

  // Skill totems.
  STATIONS.skills.forEach((p, i) => {
    const side = i % 2 ? -1 : 1;
    const { pos } = placeAt(track, p, side, 10);
    const color = new THREE.Color(SKILLS[i].color);
    const g = new THREE.Group();
    g.position.copy(pos);
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 6, 1.6),
      new THREE.MeshStandardMaterial({ color: '#23202b', roughness: 0.6, metalness: 0.3 }),
    );
    pillar.position.y = 3;
    pillar.castShadow = true;
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(1.66, 0.3, 1.66),
      new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.5), toneMapped: false }),
    );
    band.position.y = 5.4;
    const gem = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.4, flatShading: true, roughness: 0.3 }),
    );
    gem.castShadow = true;
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.06, 8, 64),
      new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(2.5), toneMapped: false }),
    );
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(SKILLS[i].title, SKILLS[i].color), depthWrite: false }));
    label.scale.set(8, 2, 1);
    label.position.y = 11;
    g.add(pillar, band, gem, halo, label);
    world.add(g);
    animated.push((t) => {
      const y = 8 + Math.sin(t * 1.5 + i) * 0.35;
      gem.position.y = halo.position.y = y;
      gem.rotation.set(t * 0.4, t * 0.8 + i, 0);
      halo.rotation.set(t * 0.6 + i, t * 0.9, 0);
    });
  });

  // Project billboards.
  PROJECTS.forEach((proj, i) => {
    const { pos, tan, right } = placeAt(track, STATIONS.projects[i], 1, 14);
    const g = new THREE.Group();
    g.position.copy(pos);
    g.rotation.y = yawOf(tan.clone().multiplyScalar(-0.5).addScaledVector(right, -0.85).normalize());
    const W = 15, H = (W * 9) / 16, cy = 6.6;
    const dark = new THREE.MeshStandardMaterial({ color: '#1d1a24', roughness: 0.5, metalness: 0.4 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, H + 0.8, 0.5), dark);
    frame.position.y = cy;
    frame.castShadow = true;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: projectTexture(proj, i === 0 ? image : null), color: new THREE.Color(0.92, 0.92, 0.92), toneMapped: false }),
    );
    screen.position.set(0, cy, 0.26);
    const legH = cy - H / 2 - 0.4;
    for (const x of [-W * 0.3, W * 0.3]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, legH, 0.5), dark);
      leg.position.set(x, legH / 2, 0);
      leg.castShadow = true;
      g.add(leg);
    }
    const glowColor = new THREE.Color('#ff7a3d');
    const glow = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.8, 0.14, 0.56),
      new THREE.MeshBasicMaterial({ color: glowColor.clone().multiplyScalar(2), toneMapped: false }),
    );
    glow.position.y = cy - H / 2 - 0.4;
    g.add(frame, screen, glow);
    world.add(g);
    screen.userData = { url: proj.url, group: g, glow, glowColor, hover: 0 };
    clickables.push(screen);
  });

  // --- street furniture ----------------------------------------------------
  {
    const lamps = [];
    for (let d = TAIL * track.length + 8; d < track.length; d += 26) {
      const f = track.frame(d / track.length);
      for (const side of [-1, 1]) {
        const base = f.pos.clone().addScaledVector(f.right, side * 6.6);
        if (!clearOfOccupied(base.x, base.z, 1.2)) continue;
        lamps.push({ base, yaw: yawOf(f.right.clone().multiplyScalar(-side)) });
      }
    }
    const parts = [
      [new THREE.CylinderGeometry(0.09, 0.13, 6.6, 6).translate(0, 3.3, 0), new THREE.MeshStandardMaterial({ color: '#2b2a31', metalness: 0.5, roughness: 0.5 })],
      [new THREE.BoxGeometry(0.08, 0.08, 1.7).translate(0, 6.5, 0.8), new THREE.MeshStandardMaterial({ color: '#2b2a31', metalness: 0.5, roughness: 0.5 })],
      [new THREE.BoxGeometry(0.42, 0.14, 0.8).translate(0, 6.42, 1.55), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a0').multiplyScalar(5), toneMapped: false })],
    ];
    for (const [geo, mat] of parts) {
      const inst = new THREE.InstancedMesh(geo, mat, lamps.length);
      inst.castShadow = !(mat instanceof THREE.MeshBasicMaterial);
      lamps.forEach((l, i) => {
        dummy.position.copy(l.base);
        dummy.rotation.set(0, l.yaw, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      world.add(inst);
    }
  }

  // Acacias and jacarandas.
  {
    const trees = [];
    for (let d = TAIL * track.length + 4; d < track.length; d += 9) {
      const f = track.frame(d / track.length);
      for (const side of [-1, 1]) {
        if (rand() > 0.72) continue;
        const pos = f.pos.clone().addScaledVector(f.right, side * (11.5 + (rand() - 0.5) * 1.4));
        if (projectSites.some((site) => site.distanceToSquared(pos) < 900)) continue;
        if (!clearOfOccupied(pos.x, pos.z, 2.5)) continue;
        trees.push(pos);
      }
    }
    for (let i = 0; i < 700; i++) {
      const f = track.frame(rand());
      const pos = f.pos.clone().addScaledVector(f.right, (rand() < 0.5 ? -1 : 1) * (20 + rand() * 150));
      if (projectSites.some((site) => site.distanceToSquared(pos) < 900)) continue;
      if (free(pos.x, pos.z, 3, ROAD_HALF + 6)) trees.push(pos);
    }
    const trunk = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.16, 0.28, 1, 6).translate(0, 0.5, 0),
      new THREE.MeshStandardMaterial({ color: '#4a3527', roughness: 1 }),
      trees.length,
    );
    const crown = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }),
      trees.length,
    );
    trunk.castShadow = crown.castShadow = true;
    const greens = ['#5f7a35', '#6f8a3c', '#4f6b2e', '#7d8f45'].map((c) => new THREE.Color(c));
    const purples = ['#9b6fd6', '#8a5fc8', '#b083e0'].map((c) => new THREE.Color(c));
    trees.forEach((pos, i) => {
      const jacaranda = rand() < 0.28;
      const h = 3 + rand() * 2.5;
      const r = jacaranda ? 1.9 + rand() * 0.9 : 2.3 + rand() * 1.2;
      dummy.position.copy(pos);
      dummy.rotation.set(0, rand() * Math.PI, 0);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      trunk.setMatrixAt(i, dummy.matrix);
      dummy.position.y = h + (jacaranda ? r * 0.4 : r * 0.12);
      dummy.scale.set(r, jacaranda ? r * 0.7 : r * 0.3, r);
      dummy.updateMatrix();
      crown.setMatrixAt(i, dummy.matrix);
      const pal = jacaranda ? purples : greens;
      crown.setColorAt(i, pal[Math.floor(rand() * pal.length)]);
    });
    world.add(trunk, crown);
  }

  // Oncoming matatus.
  const matatus = [
    ['#1b1b22', '#ff3d7f'], ['#f2c94c', '#1b4d8f'], ['#e9e4d8', '#37c47b'],
    ['#7a2fd0', '#f2c94c'], ['#d6302b', '#ffffff'], ['#0f6b5f', '#ff7a3d'], ['#14213d', '#fca311'],
  ].map(([body, accent], i, arr) => {
    const object = makeMatatu(body, accent);
    world.add(object);
    return { object, u: i / arr.length + rand() * 0.05, speed: 11 + rand() * 5 };
  });
  const mf = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };

  let hovered = null;

  return {
    clickables,
    setHover(mesh) {
      hovered = mesh;
    },
    update(dt, time, focus, camera) {
      sky.position.copy(camera.position);
      sun.target.position.copy(focus);
      sun.position.copy(focus).addScaledVector(sunDir, 140);
      for (const m of matatus) {
        m.u -= (m.speed * dt) / track.length;
        if (m.u < 0) m.u += 1;
        track.frame(m.u, mf);
        m.object.position.copy(mf.pos).addScaledVector(mf.right, LANE);
        m.object.rotation.y = yawOf(mf.tan) + Math.PI;
      }
      for (const fn of animated) fn(time, dt);
      for (const c of clickables) {
        const d = c.userData;
        d.hover += ((c === hovered ? 1 : 0) - d.hover) * (1 - Math.exp(-dt * 10));
        d.group.scale.setScalar(1 + d.hover * 0.04);
        d.glow.material.color.copy(d.glowColor).multiplyScalar(2 + d.hover * 5);
      }
    },
  };
}
