// HD-2D look: pixel billboards in a lit 3D diorama, plus bloom and tilt-shift blur.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { HorizontalTiltShiftShader } from 'three/addons/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/addons/shaders/VerticalTiltShiftShader.js';
import { drawSprite, drawEffect, FRAMES, FX_FRAMES, VIEWS } from './sprites.js';
import { RES } from './sheets.js';

const PX = 0.06; // world units per sprite pixel
const FX_PX = 0.07; // spell effects draw a touch larger than characters
const BLUR = 2; // tilt-shift strength in screen pixels
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Party stands in the foreground with their backs to the camera; enemies face them from the back of the room.
const SLOTS = { party: [[-2.4, 2.6], [0, 3.1], [2.4, 2.6]], enemy: [[-2.6, -2.6], [0, -3.4], [2.6, -2.6]] };
const WIDE = { pos: new THREE.Vector3(0, 4, 12), look: new THREE.Vector3(0, 1, -1.5) };
// P5 / Expedition 33 framing: camera behind the hero's outer shoulder (s = which side, flank = hero on the edge
// of the line), looking back across the room so the hero holds one side and enemies fill the rest.
// The idle camera cycles through these while the player decides.
const SHOTS = [
  (s, flank) => ({ off: new THREE.Vector3((flank ? 1.4 : 2.2) * s, 3.2, 6), look: new THREE.Vector3(-s * (flank ? 2.8 : 1.4), 0.7, -3) }),
  // low and close, the enemies loom
  (s, flank) => ({ off: new THREE.Vector3((flank ? 1.1 : 1.8) * s, 1.4, 4.6), look: new THREE.Vector3(-s * (flank ? 2.4 : 1.2), 1.6, -3) }),
  // high and wide, a tactical look
  (s, flank) => ({ off: new THREE.Vector3((flank ? 2.2 : 3) * s, 5.5, 7.5), look: new THREE.Vector3(-s * (flank ? 2 : 1), 0.2, -2.5) }),
];
const IDLE_CUT_MS = 4000;
// Each hero's camera personality, layered on top of the shots above.
// dy/lookY: raise or lower the camera and its aim; roll: tilt in radians (dutch angle); orbit: drift around them.
const CAM_STYLE = {
  low: { dy: -1.6, lookY: 1.1, roll: 0, orbit: 0 }, // heroic: down low, looking up at Lumen
  dutch: { dy: 0.5, lookY: 0, roll: 0.1, orbit: 0 }, // power angle: Brann on a tilted horizon
  orbit: { dy: -0.3, lookY: 0.3, roll: 0, orbit: 1.1 }, // graceful: a slow circle around Sela
};
const NO_STYLE = { dy: 0, lookY: 0, roll: 0, orbit: 0 };

const crisp = tex => {
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

function canvasTexture(w, h, draw) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  draw(c.getContext('2d'));
  return crisp(new THREE.CanvasTexture(c));
}

// Auto normal map: distance from the sprite's edge becomes height, so each pixel bevels toward its outline and
// torches and spell flashes shade characters like rounded forms instead of flat cards (the HD-2D lighting trick).
function normalTexture(g) {
  const { w, h, px } = g, H = px.map(row => row.map(c => (c ? 4 : 0)));
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : H[y][x]);
  for (let pass = 0; pass < 4; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) if (px[y][x]) H[y][x] = Math.min(H[y][x], 1 + Math.min(at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)));
    }
  }
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h }), ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // tangent space is Y-up while the image is Y-down, hence the sign on ny
      const nx = -(at(x + 1, y) - at(x - 1, y)), ny = at(x, y + 1) - at(x, y - 1), nz = 2.5, l = Math.hypot(nx, ny, nz);
      img.data.set([((nx / l) * 0.5 + 0.5) * 255, ((ny / l) * 0.5 + 0.5) * 255, ((nz / l) * 0.5 + 0.5) * 255, 255], (y * w + x) * 4);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = crisp(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.NoColorSpace; // normals are data, not color
  return tex;
}

// One color texture plus one emissive mask holding only the glowing ('*') pixels (plus a normal map for characters).
// Hand-made art: its bright glowing bits (embers, flames, gems, ice, a red visor) light the emissive mask.
const isGlow = (r, g, b) => (r > 235 && g > 110 && g < 200 && b < 110) || (b > 225 && g > 190 && r < 170) || (r > 225 && g < 90 && b < 90);
function canvasTextures(cnv, allGlow) {
  const { width: w, height: h } = cnv, { data } = cnv.getContext('2d').getImageData(0, 0, w, h);
  const map = new THREE.CanvasTexture(cnv);
  map.colorSpace = THREE.SRGBColorSpace;
  map.magFilter = THREE.NearestFilter; // crisp up close; mipmaps keep it from shimmering when small
  const glow = canvasTexture(w, h, ctx => {
    const out = ctx.createImageData(w, h);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] && (allGlow || isGlow(data[i], data[i + 1], data[i + 2]))) out.data.set(data.subarray(i, i + 4), i);
    }
    ctx.putImageData(out, 0, 0);
  });
  const px = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => data[(y * w + x) * 4 + 3] > 0));
  return { map, glow, normal: normalTexture({ w, h, px }) };
}

function spriteTextures(g, allGlow, withNormal = false) {
  const paint = pickColor => canvasTexture(g.w, g.h, ctx => g.px.forEach((row, y) => row.forEach((c, x) => {
    const col = c && pickColor(c);
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  })));
  return {
    map: paint(c => c.replace('*', '')),
    glow: paint(c => (allGlow || c[0] === '*') && c.replace('*', '')),
    normal: withNormal ? normalTexture(g) : null,
  };
}

// Seeded so the stage looks the same every load.
function rng(seed) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function stoneTexture(base, seed) {
  const r = rng(seed);
  const tex = canvasTexture(32, 32, g => {
    g.fillStyle = base;
    g.fillRect(0, 0, 32, 32);
    for (let i = 0; i < 90; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.07)';
      g.fillRect((r() * 32) | 0, (r() * 32) | 0, 1 + (r() * 2 | 0), 1);
    }
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(0, 0, 32, 1); g.fillRect(0, 16, 32, 1); g.fillRect(0, 0, 1, 16); g.fillRect(16, 16, 1, 16);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function skyTexture() {
  const r = rng(7);
  return canvasTexture(160, 72, g => {
    const grad = g.createLinearGradient(0, 0, 0, 72);
    grad.addColorStop(0, '#0b0a1f');
    grad.addColorStop(0.6, '#2b1e44');
    grad.addColorStop(1, '#6a3a52');
    g.fillStyle = grad;
    g.fillRect(0, 0, 160, 72);
    for (let i = 0; i < 70; i++) {
      g.fillStyle = r() < 0.2 ? '#ffe9b0' : '#cfd6ff';
      g.fillRect((r() * 160) | 0, (r() * 45) | 0, 1, 1);
    }
    g.fillStyle = '#f3ead7';
    g.beginPath(); g.arc(118, 16, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b1e44';
    g.beginPath(); g.arc(121, 14, 6, 0, Math.PI * 2); g.fill();
  });
}

const ease = t => 1 - (1 - t) ** 3;
const tween = (ms, fn) => new Promise(done => {
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, (now - t0) / ms);
    fn(t);
    t < 1 ? requestAnimationFrame(step) : done();
  };
  requestAnimationFrame(step);
});

// Faked pose to show for the newer poses when a character has no real animation for them.
const POSE_FALLBACK = { charge: 'windup', release: 'strike', recover: 'idle0', parry: 'strike', dodge: 'hurt', ko: 'down' };

// Real animation frame for a pose, if the character has a strip for it in this view (null = use the faked pose).
// One-shot animations play from when the pose started; loops run on the clock.
function animFrame(a, view, pose, t) {
  const set = a.anims[view];
  if (!set) return null;
  const since = (performance.now() - a.poseAt) / 1000;
  const loop = (list, fps) => list && list[Math.floor(t * fps + a.phase * 4) % list.length];
  const once = (list, fps) => list && list[Math.min(list.length - 1, Math.floor(since * fps))];
  switch (pose) {
    case null: return loop(set.idle, 6);
    case 'windup': return set.attack?.[1];
    case 'smear': case 'strike': return set.attack?.[2];
    case 'charge': return once(set.cast?.slice(0, 2), 5);
    case 'release': return set.cast?.[2];
    case 'recover': return set[a.lastMove]?.[3];
    case 'hurt': return once(set.hurt, 8);
    case 'parry': return once(set.parry, 10);
    case 'dodge': return once(set.dodge, 12);
    case 'down': return loop(set.down, 3);
    case 'ko': return once(set.ko, 6);
    case 'victory': return loop(set.victory, 5);
    default: return null;
  }
}

export function createStage(container, units, art = new Map()) {
  const renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120e22');
  scene.fog = new THREE.FogExp2('#1b1430', 0.028);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const camPos = WIDE.pos.clone(), camLook = WIDE.look.clone();
  const goalPos = WIDE.pos.clone(), goalLook = WIDE.look.clone();
  let fit = 1;

  // Lights: cool moon key, warm torches, one reusable light for hit flashes (adding lights live recompiles shaders).
  scene.add(new THREE.HemisphereLight('#7d8fd6', '#2a1c16', 1.4));
  const moon = new THREE.DirectionalLight('#b9c8ff', 1.6);
  moon.position.set(-6, 12, 6);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.bias = -0.0005;
  scene.add(moon);
  const fxLight = new THREE.PointLight('#ffffff', 0, 6, 2);
  scene.add(fxLight);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ map: stoneTexture('#3a3346', 1), roughness: 0.95 }));
  floor.material.map.repeat.set(20, 15);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ map: stoneTexture('#4a4458', 2), roughness: 1 });
  wallMat.map.repeat.set(1, 3);
  for (const [x, z, h] of [[-7, -4, 5], [-4, -7.5, 6.5], [4.5, -7.5, 3], [7, -4, 5.5], [-9, 2, 2], [9, 1.5, 1.2]]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1, h, 1), wallMat);
    pillar.position.set(x, h / 2, z);
    pillar.castShadow = pillar.receiveShadow = true;
    scene.add(pillar);
  }

  const sky = new THREE.Mesh(new THREE.PlaneGeometry(90, 40), new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false }));
  sky.position.set(0, 14, -25);
  scene.add(sky);

  const torches = [];
  for (const x of [-5, 5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 0.2), wallMat);
    post.position.set(x, 0.8, -3.5);
    post.castShadow = true;
    const flame = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb347').multiplyScalar(4) }));
    flame.position.set(x, 1.75, -3.5);
    const light = new THREE.PointLight('#ff9a3c', 25, 14, 2);
    light.position.set(x, 1.95, -3.3);
    scene.add(post, flame, light);
    torches.push({ light, flame, seed: x });
  }

  const r = rng(3);
  const motes = new Float32Array(60 * 3).map((_, i) => (i % 3 === 0 ? (r() - 0.5) * 18 : i % 3 === 1 ? r() * 4 : (r() - 0.5) * 10));
  const fireflies = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(motes, 3)),
    new THREE.PointsMaterial({ color: new THREE.Color('#ffe9a0').multiplyScalar(3), size: 0.07 }),
  );
  const moteBase = motes.slice();
  scene.add(fireflies);

  // Actors: y-axis billboards so they face the camera but still cast shadows on the floor.
  const BASE_GLOW = 1.4;
  const GOLD = new THREE.Color('#ffd25a'), WHITE = new THREE.Color('#ffffff');
  const actors = new Map();
  // Soft contact shadow under every actor, so they sit on the floor even when the moon shadow falls behind them.
  const blobTex = canvasTexture(16, 16, g => {
    const grad = g.createRadialGradient(8, 8, 1, 8, 8, 8);
    grad.addColorStop(0, 'rgba(0,0,0,.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 16, 16);
  });
  const flatDecal = (tex, size, opacity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity }));
    m.rotation.x = -Math.PI / 2;
    scene.add(m);
    return m;
  };
  const dizzyFrames = Array.from({ length: FX_FRAMES }, (_, f) => spriteTextures(drawEffect('dizzy', f), true).map);
  const used = { party: 0, enemy: 0 };
  units.forEach((u, i) => {
    // frames[view][frame] -> { map, glow }
    // hand-made sheet if there is one, otherwise the procedural pixel art
    const sheet = art.get(u.sprite);
    const frames = Object.fromEntries(VIEWS.map(v => [v, Object.fromEntries(FRAMES.map(f => [f, sheet
      ? canvasTextures(sheet.frames[v][f], u.glow)
      : spriteTextures(drawSprite(u.sprite, f, v), u.glow, true)]))]));
    const anims = Object.fromEntries(Object.entries(sheet?.anims ?? {}).map(([view, set]) => [view,
      Object.fromEntries(Object.entries(set).map(([name, list]) => [name, list.map(c => canvasTextures(c, u.glow))]))]));
    const k = sheet ? 1 / RES : 1; // sheet textures carry RES pixels per game pixel
    const w = frames.front.idle0.map.image.width * k, h = frames.front.idle0.map.image.height * k;
    const body = sheet?.body ?? { w, h }; // sheet canvases have headroom; the body is the character itself
    const [x, z] = SLOTS[u.side][used[u.side]++];
    const mat = new THREE.MeshStandardMaterial({
      map: frames.front.idle0.map, emissiveMap: frames.front.idle0.glow, emissive: '#ffffff', emissiveIntensity: BASE_GLOW,
      normalMap: frames.front.idle0.normal, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85,
      // the Wisp is a ghost: see-through, so torchlight and the room show through it
      ...(u.fx?.ghost && { transparent: true, opacity: 0.8, depthWrite: false }),
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w * PX, h * PX).translate(0, (h * PX) / 2, 0), mat);
    mesh.castShadow = true;
    mesh.position.set(x, u.float ? 0.45 : 0, z);
    scene.add(mesh);
    const fx = u.fx ?? {};
    const shadow = flatDecal(blobTex, body.w * PX * 0.9, u.float ? 0.3 : 0.55);
    shadow.scale.y = 0.45;
    const decal = fx.decal && flatDecal(spriteTextures(drawEffect(fx.decal, 0), true).map, 1.9, 0.6);
    // a real light on the character: Lumen's staff gem, Sela's crystal, the Hound's embers
    const light = fx.light && new THREE.PointLight(fx.light, 1.5, 3, 2);
    if (light) scene.add(light);
    const stars = new THREE.Mesh(new THREE.PlaneGeometry(24 * 0.05, 10 * 0.05), new THREE.MeshBasicMaterial({ map: dizzyFrames[0], alphaTest: 0.5, color: new THREE.Color(1.5, 1.5, 1.5) }));
    stars.visible = false;
    scene.add(stars);
    const actorState = {
      fx, shadow, decal, light, stars, cam: CAM_STYLE[u.cam] ?? NO_STYLE, boost: false, tint: new THREE.Color(), tintUntil: 0, flashI: 0,
      side: u.side, mesh, mat, frames, anims, width: body.w * PX, height: body.h * PX, home: mesh.position.clone(),
      koAnim: Object.values(anims).some(set => set.ko), lastMove: 'attack',
      facing: u.side === 'party' ? -1 : 1, // z direction the actor faces: the two lines face each other
      float: u.float, flashing: false, down: false, dead: false, sx: 1, phase: i * 0.37, poseAt: performance.now(),
    };
    // pose remembers when it last changed, so one-shot animations know how far along they are
    let pose = null;
    Object.defineProperty(actorState, 'pose', {
      get: () => pose,
      set(v) {
        if (v !== pose) actorState.poseAt = performance.now();
        pose = v;
      },
    });
    actors.set(u.id, actorState);
  });

  const MAX_P = 500, pPos = new Float32Array(MAX_P * 3).fill(-100), pCol = new Float32Array(MAX_P * 3);
  const pVel = new Float32Array(MAX_P * 3), pLife = new Float32Array(MAX_P), pGrav = new Float32Array(MAX_P);
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.07, vertexColors: true })));
  let pNext = 0;
  const tmpColor = new THREE.Color();
  // gravity < 0 floats up (embers, spirit motes), > 0 falls (rust flakes)
  function spawn(pos, color, { spread = 0.3, speed = 0.8, gravity = -0.6, life = 1.2, bright = 3 } = {}) {
    const i = pNext;
    pNext = (pNext + 1) % MAX_P;
    pPos.set([pos.x + (Math.random() - 0.5) * spread, pos.y + (Math.random() - 0.5) * spread, pos.z + (Math.random() - 0.5) * spread], i * 3);
    pVel.set([(Math.random() - 0.5) * speed, Math.random() * speed * (gravity < 0 ? 1 : 0.5), (Math.random() - 0.5) * speed], i * 3);
    tmpColor.set(color).multiplyScalar(bright);
    pCol.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
    pLife[i] = life;
    pGrav[i] = gravity;
  }
  const burst = (a, color, n, opts) => {
    const at = a.mesh.position.clone().setY(a.mesh.position.y + a.height * 0.5);
    for (let i = 0; i < n; i++) spawn(at, color, opts);
  };
  let frozenUntil = 0; // hit stop: hold the current frame for a beat on impact

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.5, 0.9));
  const hTilt = new ShaderPass(HorizontalTiltShiftShader);
  const vTilt = new ShaderPass(VerticalTiltShiftShader);
  hTilt.uniforms.r.value = vTilt.uniforms.r.value = 0.5;
  composer.addPass(hTilt);
  composer.addPass(vTilt);
  composer.addPass(new OutputPass());

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    // Portrait screens get a wider lens and a camera pulled further back along its line of sight.
    camera.fov = camera.aspect < 1 ? 55 : 40;
    fit = camera.aspect < 1 ? 1.7 : 1;
    camera.updateProjectionMatrix();
    hTilt.uniforms.h.value = BLUR / w;
    vTilt.uniforms.v.value = BLUR / h;
  }
  addEventListener('resize', resize);
  resize();

  let shake = 0;
  const offset = new THREE.Vector3(), look2 = new THREE.Vector3();
  let last = 0;
  renderer.setAnimationLoop(now => {
    if (performance.now() < frozenUntil) return; // hit stop: skip drawing so the last frame holds
    const t = now / 1000, dt = Math.min(0.1, t - last);
    last = t;
    const k = calm ? 1 : 1 - Math.exp(-4 * dt); // frame-rate independent ease toward the goal shot
    camPos.lerp(goalPos, k);
    camLook.lerp(goalLook, k);
    camera.position.copy(camLook).add(offset.subVectors(camPos, camLook).multiplyScalar(fit));
    if (!calm) camera.position.x += Math.sin(t * 0.4) * 0.08;
    if (!calm && style.orbit) {
      // slow drift around the hero: sideways and in/out, so the angle on her keeps changing
      camera.position.x += Math.sin(t * 0.5) * style.orbit;
      camera.position.z += Math.cos(t * 0.5) * style.orbit * 0.5;
    }
    roll += (goalRoll - roll) * k;
    camera.up.set(Math.sin(roll), Math.cos(roll), 0); // dutch tilt
    if (shake > 0.001) {
      camera.position.x += (Math.random() - 0.5) * shake;
      camera.position.y += (Math.random() - 0.5) * shake;
      shake *= 0.88;
    }
    camera.lookAt(camLook);

    for (const { light, flame, seed } of torches) {
      const f = 1 + Math.sin(t * 13 + seed) * 0.08 + Math.sin(t * 7.3 + seed * 2) * 0.06;
      light.intensity = 25 * f;
      flame.scale.setScalar(f);
    }
    for (let i = 0; i < motes.length; i += 3) {
      motes[i + 1] = moteBase[i + 1] + Math.sin(t * 0.6 + i) * 0.3;
      motes[i] = moteBase[i] + Math.cos(t * 0.4 + i) * 0.2;
    }
    fireflies.geometry.attributes.position.needsUpdate = true;
    for (let i = 0; i < MAX_P; i++) {
      if (pLife[i] <= 0) continue;
      pLife[i] -= dt;
      pVel[i * 3 + 1] -= pGrav[i] * dt;
      for (let k = 0; k < 3; k++) pPos[i * 3 + k] += pVel[i * 3 + k] * dt;
      if (pLife[i] <= 0) pPos[i * 3 + 1] = -100;
    }
    pGeo.attributes.position.needsUpdate = true;
    pGeo.attributes.color.needsUpdate = true;

    for (const a of actors.values()) {
      const { mesh, mat } = a;
      // Pick front/back/side from where the camera sits relative to the way the actor faces.
      look2.set(mesh.position.x - camera.position.x, 0, mesh.position.z - camera.position.z).normalize();
      const toward = -look2.z * a.facing;
      const view = toward > 0.5 ? 'front' : toward < -0.5 ? 'back' : 'side';
      const flip = view === 'side' && a.facing * look2.x < 0 ? -1 : 1; // side art faces right; mirror it to face left
      const idle = `idle${Math.floor(t * 3 + a.phase * 4) % 4}`;
      const pose = a.pose ?? (a.dead && a.koAnim ? 'ko' : a.down ? 'down' : null);
      const f = animFrame(a, view, pose, t) ?? a.frames[view][POSE_FALLBACK[pose] ?? pose ?? idle];
      mat.map = f.map;
      mat.normalMap = f.normal;
      // Emission, in priority order: hit flash, baton-boost gold aura, fading element tint from the last hit,
      // otherwise just the glowing pixels, breathing softly and flaring on wind-up as an attack tell.
      const pulse = 1 + 0.25 * Math.sin(t * 3 + a.phase * 5);
      if (a.flashing) {
        mat.emissiveMap = f.map;
        mat.emissive.copy(WHITE);
        mat.emissiveIntensity = a.flashI;
      } else if (a.boost) {
        mat.emissiveMap = f.map;
        mat.emissive.copy(GOLD);
        mat.emissiveIntensity = 0.3 + 0.15 * Math.sin(t * 6);
      } else if (now < a.tintUntil) {
        mat.emissiveMap = f.map;
        mat.emissive.copy(a.tint);
        mat.emissiveIntensity = 0.7 * ((a.tintUntil - now) / 1200);
      } else {
        mat.emissiveMap = f.glow;
        mat.emissive.copy(WHITE);
        mat.emissiveIntensity = BASE_GLOW * pulse * (a.pose === 'windup' || a.pose === 'charge' ? 2.5 : 1);
      }
      const p = mesh.position, alive = !a.dead;
      a.shadow.position.set(p.x, 0.02, p.z);
      a.shadow.visible = alive && !a.hidden;
      if (a.decal) {
        a.decal.position.set(a.home.x, 0.03, a.home.z);
        a.decal.visible = alive;
        a.decal.rotation.z = t * 0.2;
      }
      if (a.light) {
        a.light.position.set(p.x, p.y + a.height * 0.55, p.z + 1); // chest height, out front: lights the figure without blowing out the hair
        a.light.intensity = alive ? 1 * pulse * (a.pose ? 2.5 : 1) : 0; // brighter while acting
      }
      if (a.fx.aura && alive && !a.hidden && Math.random() < (a.pose === 'windup' ? 0.6 : 0.12) * dt * 60) {
        spawn(p.clone().setY(p.y + a.height * (0.3 + Math.random() * 0.4)), a.fx.aura, { spread: a.width * 0.6, speed: 0.2, gravity: -0.4, life: 1.4, bright: 2.5 });
      }
      a.stars.visible = a.down && alive;
      if (a.stars.visible) {
        a.stars.material.map = dizzyFrames[Math.floor(t * 10) % FX_FRAMES];
        a.stars.position.set(p.x, p.y + a.height * 0.75 + 0.35, p.z);
        a.stars.rotation.y = mesh.rotation.y;
      }
      mesh.rotation.y = Math.atan2(camera.position.x - mesh.position.x, camera.position.z - mesh.position.z);
      const targetY = a.dead ? 0 : 1;
      mesh.scale.y += (targetY - mesh.scale.y) * 0.2;
      if (a.dead && !a.koAnim) a.sx += (0 - a.sx) * 0.2; // no KO animation: shrink away instead
      mesh.scale.x = a.sx * flip;
      mesh.visible = !a.hidden && a.sx > 0.02;
      if (a.float && !a.dead) mesh.position.y = a.home.y + Math.sin(t * 1.8 + a.phase) * 0.12;
    }
    composer.render();
  });

  const fxCache = {};
  const fxFrames = el => (fxCache[el] ??= Array.from({ length: FX_FRAMES }, (_, f) => spriteTextures(drawEffect(el, f), true).map));

  let focused = null, shot = 0, idleTimer;
  let roll = 0, goalRoll = 0, style = NO_STYLE, side = 1;
  function aimShot() {
    if (!focused) {
      goalPos.copy(WIDE.pos);
      goalLook.copy(WIDE.look);
      style = NO_STYLE;
      goalRoll = 0;
      return;
    }
    side = focused.home.x >= 0 ? 1 : -1;
    style = focused.cam;
    const { off, look } = SHOTS[shot](side, Math.abs(focused.home.x) > 0.5);
    goalPos.copy(focused.home).add(off);
    goalPos.y = Math.max(0.6, goalPos.y + style.dy);
    goalLook.copy(look);
    goalLook.y += style.lookY;
    goalRoll = style.roll * side;
  }

  // Plays an effect's frames on a camera-facing plane standing at pos (its bottom edge), nudged toward the camera.
  // flat: lie on the floor (rune circles, cracks) instead of facing the camera; tint: multiply by an element color.
  async function flipbook(element, pos, { px = FX_PX, frameMs = 70, loops = 1, bright = 1.6, flat = false, tint = '#ffffff' } = {}) {
    const frames = fxFrames(element);
    const { width: w, height: h } = frames[0].image;
    const mat = new THREE.MeshBasicMaterial({ map: frames[0], color: new THREE.Color(tint).multiplyScalar(bright), alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    const fx = new THREE.Mesh(new THREE.PlaneGeometry(w * px, h * px).translate(0, flat ? 0 : (h * px) / 2, 0), mat);
    if (flat) {
      fx.position.copy(pos).setY(0.04);
      fx.rotation.x = -Math.PI / 2;
    } else {
      fx.position.copy(pos).add(camera.position.clone().sub(pos).setY(0).normalize().multiplyScalar(0.3));
      fx.rotation.y = Math.atan2(camera.position.x - fx.position.x, camera.position.z - fx.position.z);
    }
    scene.add(fx);
    await tween(FX_FRAMES * frameMs * loops, t => { mat.map = frames[Math.min(FX_FRAMES * loops - 1, Math.floor(t * FX_FRAMES * loops)) % FX_FRAMES]; });
    scene.remove(fx);
    fx.geometry.dispose();
    mat.dispose();
  }

  // Fading copy left behind a dashing ghost.
  function afterimage(a) {
    const mat = a.mat.clone();
    Object.assign(mat, { transparent: true, opacity: 0.45, depthWrite: false });
    const ghost = new THREE.Mesh(a.mesh.geometry, mat);
    ghost.position.copy(a.mesh.position);
    ghost.rotation.copy(a.mesh.rotation);
    ghost.scale.copy(a.mesh.scale);
    scene.add(ghost);
    tween(300, t => (mat.opacity = 0.45 * (1 - t))).then(() => {
      scene.remove(ghost);
      mat.dispose();
    });
  }

  const actor = id => actors.get(id);
  return {
    // Over the active hero's shoulder (cycling angles while idle), or the wide shot when id is null.
    // cut: jump straight there instead of gliding (e.g. from an intro close-up, whose path would cross the party).
    focus(id, cut = false) {
      clearInterval(idleTimer);
      focused = actor(id)?.side === 'party' ? actor(id) : null;
      shot = 0;
      aimShot();
      if (cut) {
        camPos.copy(goalPos);
        camLook.copy(goalLook);
      } else if (focused && !calm) {
        // a hero's turn opens with a swoop: start wide and high off their outer side, then glide into the shot
        camPos.copy(goalPos).add(new THREE.Vector3(side * 2.5, 2.2, 3));
      }
      if (focused && !calm) {
        idleTimer = setInterval(() => {
          shot = (shot + 1) % SHOTS.length;
          aimShot();
        }, IDLE_CUT_MS);
      }
      const t0 = performance.now();
      return new Promise(done => {
        const check = () => {
          if (camPos.distanceTo(goalPos) < 0.05) return done();
          // Slow device or background tab: snap, so menus and targets get placed against the final shot.
          if (performance.now() - t0 > 1200) {
            camPos.copy(goalPos);
            camLook.copy(goalLook);
            camera.position.copy(camLook).add(offset.subVectors(camPos, camLook).multiplyScalar(fit));
            camera.lookAt(camLook);
            camera.updateMatrixWorld();
            return done();
          }
          requestAnimationFrame(check);
        };
        check();
      });
    },
    // Stop the idle camera once the player has committed to an action.
    hold() { clearInterval(idleTimer); },
    // Free aim: back to the standard shoulder shot and stay there, so targets don't move under the reticle.
    steady() {
      clearInterval(idleTimer);
      shot = 0;
      aimShot();
    },
    // Ranged skills: wind up in place and lob a glowing bolt at the target. retreat() clears the pose after.
    async cast(id, targetId, color) {
      const a = actor(id), b = actor(targetId);
      a.lastMove = 'cast';
      a.pose = 'charge';
      flipbook('rune', a.home.clone(), { px: 0.07, frameMs: 90, tint: color, bright: 2.2, flat: true });
      await tween(260, () => {});
      a.pose = 'release';
      const bolt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(4) }));
      const from = a.mesh.position.clone().setY(a.mesh.position.y + a.height * 0.8);
      const to = b.mesh.position.clone().setY(b.mesh.position.y + b.height * 0.5);
      scene.add(bolt);
      await tween(280, t => {
        bolt.position.lerpVectors(from, to, t).y += Math.sin(t * Math.PI) * 0.6; // slight arc
        bolt.rotation.z = t * 8;
      });
      scene.remove(bolt);
      bolt.geometry.dispose();
      bolt.material.dispose();
    },
    // Follow-up hit of an enemy combo, already in striking range: wind up, then snap the strike on the beat.
    async jab(id, ms) {
      const a = actor(id);
      a.pose = 'windup';
      await tween(Math.max(0, ms - 120), () => {});
      a.pose = 'smear';
      await tween(60, () => {});
      a.pose = 'strike';
      await tween(60, () => {});
    },
    // Flipbook at the target; grounded effects rise from the feet, the rest burst at mid-body.
    effect(id, element) {
      const a = actor(id), pos = a.mesh.position.clone();
      if (!['fire', 'ice', 'elec'].includes(element)) pos.y += a.height * 0.5 - (fxFrames(element)[0].image.height * FX_PX) / 2;
      return flipbook(element, pos);
    },
    // Intro shot: cut to a close-up of one enemy, then drift in on it.
    reveal(id) {
      const a = actor(id);
      clearInterval(idleTimer);
      focused = null;
      camLook.copy(a.home).setY(a.home.y + a.height * 0.55);
      goalLook.copy(camLook);
      camPos.copy(a.home).add(new THREE.Vector3(1.2, 1.2, 4.2));
      goalPos.copy(a.home).add(new THREE.Vector3(0.5, 1, 3));
    },
    // All-Out Attack: the party piles into a cartoon dust cloud over the enemies while hits pop out of it.
    async brawl(partyIds, foeIds, onImpact) {
      const crew = partyIds.map(actor);
      const center = foeIds.reduce((c, id) => c.add(actor(id).home), new THREE.Vector3()).divideScalar(foeIds.length).setY(0);
      await Promise.all(crew.map((a, i) => {
        a.pose = 'strike';
        const to = center.clone().add(new THREE.Vector3((i - 1) * 0.8, 0, 1.2));
        return tween(260, t => a.mesh.position.lerpVectors(a.home, to, ease(t)));
      }));
      crew.forEach(a => (a.hidden = true));
      const impacts = setInterval(() => {
        const id = foeIds[Math.floor(Math.random() * foeIds.length)];
        this.effect(id, 'phys');
        this.shake(0.25);
        onImpact?.();
      }, 150);
      await flipbook('brawl', center.clone().add(new THREE.Vector3(0, 0, 1)), { px: 0.12, frameMs: 60, loops: 5, bright: 0.95 });
      clearInterval(impacts);
      crew.forEach(a => {
        a.hidden = false;
        a.pose = null;
        a.mesh.position.copy(a.home);
      });
    },
    // Enemy turns stretch the wind-up so the dash lands exactly when the parry ring closes.
    async strike(id, targetId, windupMs = 220, dashMs = 200) {
      const a = actor(id), b = actor(targetId);
      a.lastMove = 'attack';
      a.pose = 'windup';
      await tween(windupMs, () => {});
      a.pose = 'smear';
      flipbook('dust', a.home.clone(), { px: a.fx.heavy ? 0.09 : 0.06, bright: 1 });
      const to = a.home.clone().lerp(b.home, 0.7).setY(a.home.y);
      let ghostAt = 0;
      await tween(dashMs, t => {
        a.mesh.position.lerpVectors(a.home, to, ease(t));
        if (t > 0.6) a.pose = 'strike';
        if (a.fx.ghost && t - ghostAt > 0.2) {
          ghostAt = t;
          afterimage(a);
        }
      });
      if (a.fx.heavy) {
        flipbook('dust', to.clone(), { px: 0.09, bright: 1 });
        this.shake(0.15);
      }
    },
    async retreat(id) {
      const a = actor(id), from = a.mesh.position.clone();
      a.pose = 'recover';
      await tween(240, t => a.mesh.position.lerpVectors(from, a.home, ease(t)));
      a.pose = null;
    },
    async dodge(id) {
      const a = actor(id);
      a.pose = 'dodge';
      await tween(320, t => { a.mesh.position.x = a.home.x + Math.sin(t * Math.PI) * 0.9; });
      if (a.pose === 'dodge') a.pose = null;
    },
    async parry(id) {
      const a = actor(id);
      a.pose = 'parry';
      await tween(420, () => {});
      if (a.pose === 'parry') a.pose = null;
    },
    async flash(id, color) {
      const a = actor(id);
      fxLight.color.set(color);
      fxLight.position.copy(a.mesh.position).add(new THREE.Vector3(0, a.height * 0.6, 0.8));
      a.pose = 'hurt';
      a.flashing = true;
      if (a.fx.hitBurst) burst(a, a.fx.hitBurst, 14, a.fx.hitBurst === '#9a4e2a' ? { gravity: 3, speed: 1.2, bright: 1.2 } : { speed: 1.4 });
      await tween(380, t => {
        fxLight.intensity = 40 * (1 - t);
        a.flashI = 2 * (1 - t);
      });
      a.flashing = false;
      // the body keeps a fading glow in the color of what hit it
      a.tint.set(color);
      a.tintUntil = performance.now() + 1200;
      if (a.pose === 'hurt') a.pose = null;
    },
    shake(amount) { if (!calm) shake = Math.max(shake, amount); },
    setDown(id, down) { actor(id).down = down; },
    ko(id) {
      const a = actor(id);
      a.dead = true;
      a.poseAt = performance.now(); // the KO animation (if any) plays from here
      if (a.fx.koBurst) burst(a, a.fx.koBurst, 50, { spread: a.width, speed: 0.6, gravity: -1.2, life: 1.8 }); // dissolves into rising motes
    },
    // Hit stop: freeze the picture for a moment on impact; longer for big hits.
    hitStop(ms) { frozenUntil = performance.now() + ms; },
    setBoost(id, on) { actor(id).boost = on; },
    // Floor effect at a unit's feet, e.g. the crack from a heavy slam.
    ground(id, element) { return flipbook(element, actor(id).home.clone(), { px: 0.09, frameMs: 80, bright: 1, flat: true }); },
    victory(ids) { ids.forEach(id => (actor(id).pose = 'victory')); },
    // CSS pixel position of a point on the actor, yFrac 0 = feet, 1 = head
    screenPos(id, yFrac = 1) {
      const a = actor(id);
      const p = a.home.clone().setY(a.home.y + a.height * yFrac).project(camera);
      return { x: (p.x + 1) / 2 * container.clientWidth, y: (1 - p.y) / 2 * container.clientHeight };
    },
    // Live on-screen sprite box (follows bobbing, camera sway and the down squash), for aiming.
    screenBox(id) {
      const a = actor(id), W = container.clientWidth, H = container.clientHeight;
      const feet = a.mesh.position.clone().project(camera);
      const head = a.mesh.position.clone().setY(a.mesh.position.y + a.height * a.mesh.scale.y).project(camera);
      const bottom = (1 - feet.y) / 2 * H, top = (1 - head.y) / 2 * H;
      return { x: (feet.x + 1) / 2 * W, top, bottom, halfW: (bottom - top) * a.width / (a.height * a.mesh.scale.y) / 2 };
    },
  };
}
