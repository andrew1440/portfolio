import * as THREE from 'three';
import { LANE } from './world.js';

const WHEEL_R = 0.34;

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
}

function buildBoda() {
  const root = new THREE.Group();
  const lean = new THREE.Group();
  root.add(lean);

  const add = (parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = true;
    parent.add(m);
    return m;
  };
  const limb = (parent, from, to, radius, mat) => {
    const dir = new THREE.Vector3().subVectors(to, from);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.9, dir.length() + radius, 7), mat);
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    parent.add(m);
  };

  const red = std('#c8242c', { metalness: 0.35, roughness: 0.35 });
  const black = std('#16161a', { roughness: 0.8 });
  const chrome = std('#c9ccd2', { metalness: 0.9, roughness: 0.25 });
  const seat = std('#2a1d18', { roughness: 0.9 });

  // Wheels: tyre + rim + spokes, spun around their own X axis.
  const wheels = [];
  for (const z of [0.68, -0.66]) {
    const w = new THREE.Group();
    w.position.set(0, WHEEL_R, z);
    add(w, new THREE.TorusGeometry(WHEEL_R - 0.06, 0.07, 10, 24), black, 0, 0, 0, 0, Math.PI / 2, 0);
    add(w, new THREE.TorusGeometry(WHEEL_R - 0.13, 0.015, 6, 20), chrome, 0, 0, 0, 0, Math.PI / 2, 0);
    for (let i = 0; i < 4; i++) {
      add(w, new THREE.BoxGeometry(0.02, (WHEEL_R - 0.12) * 2, 0.025), chrome, 0, 0, 0, (i * Math.PI) / 4, 0, 0);
    }
    lean.add(w);
    wheels.push(w);
  }

  // Frame and body work.
  add(lean, new THREE.BoxGeometry(0.06, 0.06, 1.0), chrome, 0, 0.62, 0.05, -0.15);
  add(lean, new THREE.CylinderGeometry(0.025, 0.025, 0.78, 6), chrome, 0.09, 0.66, 0.6, 0.42);
  add(lean, new THREE.CylinderGeometry(0.025, 0.025, 0.78, 6), chrome, -0.09, 0.66, 0.6, 0.42);
  add(lean, new THREE.BoxGeometry(0.3, 0.22, 0.48), red, 0, 0.86, 0.3, -0.12);
  add(lean, new THREE.BoxGeometry(0.28, 0.1, 0.78), seat, 0, 0.84, -0.22);
  add(lean, new THREE.BoxGeometry(0.26, 0.26, 0.36), std('#3a3a40', { metalness: 0.6, roughness: 0.4 }), 0, 0.5, 0.06);
  add(lean, new THREE.CylinderGeometry(0.045, 0.06, 0.8, 8), chrome, 0.17, 0.42, -0.36, Math.PI / 2 - 0.15);
  add(lean, new THREE.BoxGeometry(0.34, 0.06, 0.5), red, 0, 0.66, -0.66);
  add(lean, new THREE.BoxGeometry(0.42, 0.03, 0.46), black, 0, 0.82, -0.72);
  add(lean, new THREE.BoxGeometry(0.22, 0.05, 0.4), red, 0, 0.73, 0.72, -0.25);

  // Handlebar with mirrors.
  add(lean, new THREE.CylinderGeometry(0.02, 0.02, 0.74, 6), chrome, 0, 1.05, 0.5, 0, 0, Math.PI / 2);
  for (const x of [-1, 1]) {
    add(lean, new THREE.CylinderGeometry(0.012, 0.012, 0.25, 4), chrome, x * 0.27, 1.17, 0.5, 0, 0, x * -0.3);
    add(lean, new THREE.CylinderGeometry(0.055, 0.055, 0.02, 10), black, x * 0.31, 1.29, 0.5, Math.PI / 2);
  }

  // Lights.
  const lamp = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4d6').multiplyScalar(6), toneMapped: false });
  add(lean, new THREE.CylinderGeometry(0.09, 0.09, 0.06, 14), lamp, 0, 0.98, 0.66, Math.PI / 2);
  add(lean, new THREE.BoxGeometry(0.16, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2020').multiplyScalar(4), toneMapped: false }), 0, 0.7, -0.92);
  const beam = new THREE.SpotLight('#ffe6b8', 12, 22, 0.42, 0.7, 1.4);
  beam.position.set(0, 0.98, 0.7);
  beam.target.position.set(0, 0, 8);
  lean.add(beam, beam.target);

  // Rider: reflective vest + orange helmet, the boda-boda uniform.
  const skin = std('#5a3826', { roughness: 0.7 });
  const vest = std('#d9ff3a', { emissive: '#9bbf10', emissiveIntensity: 0.35, roughness: 0.5 });
  const pants = std('#22283a', { roughness: 0.9 });
  const helmet = std('#ff7a3d', { metalness: 0.2, roughness: 0.25 });
  const visor = std('#141821', { metalness: 0.8, roughness: 0.1 });
  const sleeve = std('#1f3a6b', { roughness: 0.8 });

  const body = new THREE.Group();
  body.position.set(0, 0.9, -0.2);
  lean.add(body);
  add(body, new THREE.BoxGeometry(0.42, 0.56, 0.26), vest, 0, 0.36, 0.08, 0.32);
  add(body, new THREE.BoxGeometry(0.44, 0.06, 0.28), std('#c0c4c8', { emissive: '#ffffff', emissiveIntensity: 0.25, metalness: 0.6, roughness: 0.3 }), 0, 0.3, 0.06, 0.32);
  add(body, new THREE.CylinderGeometry(0.06, 0.07, 0.08, 8), skin, 0, 0.66, 0.2);
  const head = new THREE.Group();
  head.position.set(0, 0.8, 0.24);
  body.add(head);
  add(head, new THREE.SphereGeometry(0.17, 16, 12), helmet, 0, 0, 0);
  add(head, new THREE.SphereGeometry(0.15, 14, 10, -1.1, 2.2, 1.0, 0.9), visor, 0, -0.01, 0.035);

  for (const x of [-1, 1]) {
    const v = (a, b, c) => new THREE.Vector3(x * a, b, c);
    limb(body, v(0.2, 0.6, 0.18), v(0.27, 0.36, 0.42), 0.055, sleeve);
    limb(body, v(0.27, 0.36, 0.42), v(0.33, 0.16, 0.7), 0.042, skin);
    limb(body, v(0.13, -0.02, 0.0), v(0.21, 0.04, 0.42), 0.075, pants);
    limb(body, v(0.21, 0.04, 0.42), v(0.22, -0.4, 0.34), 0.06, pants);
    add(body, new THREE.BoxGeometry(0.1, 0.08, 0.22), black, x * 0.22, -0.43, 0.4);
  }

  root.traverse((o) => {
    if (o.isMesh) o.receiveShadow = true;
  });
  return { root, lean, wheels, body, head };
}

export function createRider(scene, track) {
  const parts = buildBoda();
  scene.add(parts.root);

  const f = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
  const ahead = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), right: new THREE.Vector3() };
  let lastU = null;
  let leanAngle = 0;
  let yaw = null;

  return {
    object: parts.root,
    position: parts.root.position,
    update(u, dt, time) {
      track.frame(u, f);
      parts.root.position.copy(f.pos).addScaledVector(f.right, -LANE);

      const targetYaw = Math.atan2(f.tan.x, f.tan.z);
      if (yaw === null) yaw = targetYaw;
      let dy = targetYaw - yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      yaw += dy * (1 - Math.exp(-dt * 12));
      parts.root.rotation.y = yaw;

      const dist = lastU === null ? 0 : (u - lastU) * track.length;
      lastU = u;
      const speed = dt > 0 ? dist / dt : 0;
      for (const w of parts.wheels) w.rotation.x += dist / WHEEL_R;

      // Lean into the bend: signed curvature times speed.
      track.frame(u + 6 / track.length, ahead);
      const turn = f.tan.x * ahead.tan.z - f.tan.z * ahead.tan.x;
      const target = THREE.MathUtils.clamp(turn * speed * 0.9, -0.45, 0.45);
      leanAngle += (target - leanAngle) * (1 - Math.exp(-dt * 5));
      parts.lean.rotation.z = leanAngle;

      // A little engine judder and head motion so the rider looks alive when idle.
      const moving = Math.min(1, Math.abs(speed) / 8);
      parts.body.position.y = 0.9 + Math.sin(time * 30) * 0.004 + Math.sin(time * 2) * 0.01 * (1 - moving);
      parts.head.rotation.y = Math.sin(time * 0.7) * 0.35 * (1 - moving);
      return speed;
    },
  };
}
