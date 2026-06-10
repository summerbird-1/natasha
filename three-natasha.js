const canvas = document.querySelector("#natasha3d");
const shell = document.querySelector(".game-shell");
const coachTip = document.querySelector("#coach");
const isFilePage = window.location.protocol === "file:";

function show3DError(message) {
  console.warn(message);
  if (coachTip) {
    coachTip.textContent = message;
    coachTip.classList.add("show");
    window.setTimeout(() => coachTip.classList.remove("show"), 3600);
  }
}

async function loadThree() {
  const sources = [
    "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
    "https://fastly.jsdelivr.net/npm/three@0.165.0/build/three.module.js",
    "https://unpkg.com/three@0.165.0/build/three.module.js",
    "https://esm.sh/three@0.165.0"
  ];

  let lastError = null;
  for (const source of sources) {
    try {
      return await import(source);
    } catch (error) {
      lastError = error;
    }
  }

  show3DError(isFilePage ? "3D库加载失败：file本地打开容易被拦截，请用本地HTTP服务或部署后访问。" : "3D库加载失败：请检查网络或CDN访问。");
  throw lastError;
}

const THREE = await loadThree();

let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
} catch (error) {
  show3DError("当前浏览器 WebGL 不可用，无法显示3D效果。");
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(24, 2 / 3, 0.1, 100);
camera.position.set(0, -0.05, 10.8);
camera.lookAt(0, -0.38, 0);

const rig = new THREE.Group();
rig.position.y = -0.18;
const RIG_BASE_SCALE = 0.86;
rig.scale.setScalar(RIG_BASE_SCALE);
scene.add(rig);

function createSoftRubberTexture() {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");
  const data = ctx.createImageData(size, size);

  for (let i = 0; i < data.data.length; i += 4) {
    const noise = 120 + Math.random() * 55;
    data.data[i] = noise;
    data.data[i + 1] = noise;
    data.data[i + 2] = noise;
    data.data[i + 3] = 255;
  }

  ctx.putImageData(data, 0, 0);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  texture.needsUpdate = true;
  return texture;
}

const rubberNoise = createSoftRubberTexture();

const skin = new THREE.MeshPhysicalMaterial({
  color: 0x3a241f,
  roughness: 0.78,
  metalness: 0,
  clearcoat: 0.42,
  clearcoatRoughness: 0.52,
  sheen: 0.3,
  bumpMap: rubberNoise,
  bumpScale: 0.045,
  roughnessMap: rubberNoise
});

const skinDark = new THREE.MeshPhysicalMaterial({
  color: 0x221412,
  roughness: 0.82,
  clearcoat: 0.28,
  bumpMap: rubberNoise,
  bumpScale: 0.035
});

const lipMat = new THREE.MeshPhysicalMaterial({
  color: 0xff6479,
  roughness: 0.48,
  clearcoat: 0.78,
  clearcoatRoughness: 0.22
});

const pantsMat = new THREE.MeshPhysicalMaterial({
  color: 0xf02f84,
  roughness: 0.56,
  clearcoat: 0.4
});

const eyeMat = new THREE.MeshBasicMaterial({ color: 0x080606 });

function mesh(geometry, material, position, scale, rotation = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.rotation.set(...rotation);
  item.castShadow = true;
  item.receiveShadow = true;
  rig.add(item);
  return item;
}

const sphere = new THREE.SphereGeometry(1, 48, 32);
const capsule = new THREE.CapsuleGeometry(0.36, 1.2, 12, 28);
const smallCapsule = new THREE.CapsuleGeometry(0.22, 0.58, 10, 20);
const box = new THREE.BoxGeometry(1, 1, 1);

const body = mesh(sphere, skin, [0, -0.74, 0], [1.18, 1.27, 0.82]);
const belly = mesh(sphere, skin, [0, -0.72, 0.08], [1.05, 0.82, 0.72]);
const head = mesh(sphere, skin, [0, 1.12, 0], [1.32, 1.25, 1.04]);
const neck = mesh(sphere, skin, [0, 0.18, -0.02], [0.46, 0.34, 0.38]);

const leftEar = mesh(sphere, skin, [-1.23, 1.08, -0.06], [0.15, 0.28, 0.12]);
const rightEar = mesh(sphere, skin, [1.23, 1.08, -0.06], [0.15, 0.28, 0.12]);

const leftArm = mesh(capsule, skin, [-1.18, -0.75, 0], [0.42, 0.72, 0.42], [0.1, 0, -0.18]);
const rightArm = mesh(capsule, skin, [1.18, -0.75, 0], [0.42, 0.72, 0.42], [0.1, 0, 0.18]);
const leftLeg = mesh(capsule, skin, [-0.48, -2.08, 0], [0.42, 0.86, 0.42], [0.02, 0, 0.02]);
const rightLeg = mesh(capsule, skin, [0.48, -2.08, 0], [0.42, 0.86, 0.42], [0.02, 0, -0.02]);
const leftShoulder = mesh(sphere, skin, [-1.03, -0.25, 0.02], [0.34, 0.38, 0.34]);
const rightShoulder = mesh(sphere, skin, [1.03, -0.25, 0.02], [0.34, 0.38, 0.34]);
const leftHip = mesh(sphere, skin, [-0.48, -1.48, 0.02], [0.38, 0.32, 0.34]);
const rightHip = mesh(sphere, skin, [0.48, -1.48, 0.02], [0.38, 0.32, 0.34]);

const leftFoot = mesh(sphere, skinDark, [-0.5, -2.88, 0.12], [0.36, 0.16, 0.28]);
const rightFoot = mesh(sphere, skinDark, [0.5, -2.88, 0.12], [0.36, 0.16, 0.28]);

const pants = mesh(sphere, pantsMat, [0, -1.42, 0.18], [1.08, 0.42, 0.68]);
pants.rotation.x = -0.05;

const knot = mesh(smallCapsule, pantsMat, [-1.02, -1.38, 0.2], [0.42, 0.24, 0.28], [0.1, 0, 0.84]);

const nose = mesh(sphere, skinDark, [0, 1.1, 0.94], [0.23, 0.12, 0.08]);
const mouth = mesh(sphere, lipMat, [0, 0.78, 1.02], [0.39, 0.16, 0.08]);
const lipLine = mesh(box, eyeMat, [0, 0.79, 1.105], [0.26, 0.01, 0.01]);
const leftEye = mesh(box, eyeMat, [-0.46, 1.32, 0.94], [0.25, 0.018, 0.012], [0, 0, -0.08]);
const rightEye = mesh(box, eyeMat, [0.46, 1.32, 0.94], [0.25, 0.018, 0.012], [0, 0, 0.08]);

const pores = new THREE.Group();
for (let i = 0; i < 34; i += 1) {
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), skinDark);
  dot.position.set((Math.random() - 0.5) * 1.2, 2.18 + Math.random() * 0.14, 0.52 + Math.random() * 0.28);
  dot.scale.setScalar(0.8 + Math.random() * 0.6);
  pores.add(dot);
}
rig.add(pores);

const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(3, 5, 5);
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
scene.add(key);
scene.add(new THREE.HemisphereLight(0xfff3f8, 0x3a241f, 1.8));

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(1.8, 48),
  new THREE.MeshBasicMaterial({ color: 0x3a2430, transparent: true, opacity: 0.12 })
);
floor.position.set(0, -3.08, -0.2);
floor.scale.set(1.3, 0.22, 1);
scene.add(floor);

const base = new Map();
for (const part of [rig, head, body, belly, leftArm, rightArm, leftLeg, rightLeg, leftFoot, rightFoot, neck, mouth, leftEye, rightEye]) {
  base.set(part, {
    position: part.position.clone(),
    scale: part.scale.clone(),
    rotation: part.rotation.clone()
  });
}

function localYAxis(rotationZ) {
  return new THREE.Vector3(-Math.sin(rotationZ), Math.cos(rotationZ), 0).normalize();
}

function limbAnchor(limb, halfLength) {
  const original = base.get(limb);
  const axis = localYAxis(original.rotation.z);
  return original.position.clone().add(axis.multiplyScalar(halfLength * original.scale.y));
}

const limbMeta = {
  leftArm: {
    limb: leftArm,
    foot: null,
    anchor: limbAnchor(leftArm, 0.88),
    halfLength: 0.88,
    baseAngle: -0.18,
    side: -1,
    stretchBoost: 1.35
  },
  rightArm: {
    limb: rightArm,
    foot: null,
    anchor: limbAnchor(rightArm, 0.88),
    halfLength: 0.88,
    baseAngle: 0.18,
    side: 1,
    stretchBoost: 1.35
  },
  leftLeg: {
    limb: leftLeg,
    foot: leftFoot,
    anchor: limbAnchor(leftLeg, 0.92),
    halfLength: 0.92,
    baseAngle: 0.02,
    side: -0.42,
    stretchBoost: 1.85
  },
  rightLeg: {
    limb: rightLeg,
    foot: rightFoot,
    anchor: limbAnchor(rightLeg, 0.92),
    halfLength: 0.92,
    baseAngle: -0.02,
    side: 0.42,
    stretchBoost: 1.85
  }
};

let mood = "idle";
let stretch = null;
let thrownUntil = 0;
let wateredUntil = 0;
let waterLevel = 0;

function fit() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function lerpPart(part, targetScale, targetPos, targetRot, speed) {
  part.scale.lerp(targetScale, speed);
  part.position.lerp(targetPos, speed);
  part.rotation.x += (targetRot.x - part.rotation.x) * speed;
  part.rotation.y += (targetRot.y - part.rotation.y) * speed;
  part.rotation.z += (targetRot.z - part.rotation.z) * speed;
}

function target(part) {
  const item = base.get(part);
  return {
    scale: item.scale.clone(),
    position: item.position.clone(),
    rotation: item.rotation.clone()
  };
}

function resetTargets(time) {
  for (const part of base.keys()) {
    const t = target(part);
    lerpPart(part, t.scale, t.position, t.rotation, 0.13);
  }

  rig.rotation.y += (Math.sin(time * 0.001) * 0.08 - rig.rotation.y) * 0.06;
  rig.rotation.z += (Math.sin(time * 0.0014) * 0.025 - rig.rotation.z) * 0.06;
  rig.position.y += (Math.sin(time * 0.002) * 0.035 - rig.position.y) * 0.05;
}

function applyMood(time) {
  if (mood === "pet") {
    mouth.scale.lerp(new THREE.Vector3(0.34, 0.12, 0.08), 0.16);
    leftEye.scale.y += (0.035 - leftEye.scale.y) * 0.2;
    rightEye.scale.y += (0.035 - rightEye.scale.y) * 0.2;
    rig.rotation.z += (Math.sin(time * 0.006) * 0.04 - rig.rotation.z) * 0.12;
  }

  if (mood === "hit") {
    rig.rotation.z += (-0.22 - rig.rotation.z) * 0.22;
    head.rotation.z += (0.3 - head.rotation.z) * 0.22;
    mouth.scale.lerp(new THREE.Vector3(0.32, 0.1, 0.08), 0.2);
  }

  if (mood === "pinch") {
    head.scale.x += (1.05 - head.scale.x) * 0.08;
    body.scale.y += (1.12 - body.scale.y) * 0.08;
  }

  if (Date.now() < wateredUntil) {
    const level = Math.max(1, waterLevel);
    head.scale.lerp(new THREE.Vector3(1.32 + level * 0.13, 1.25 + level * 0.1, 1.04 + level * 0.06), 0.08);
    body.scale.lerp(new THREE.Vector3(1.18 + level * 0.16, 1.27 + level * 0.14, 0.82 + level * 0.04), 0.08);
    belly.scale.lerp(new THREE.Vector3(1.05 + level * 0.18, 0.82 + level * 0.16, 0.72 + level * 0.06), 0.1);
    leftArm.scale.y += (0.56 - leftArm.scale.y) * 0.08;
    rightArm.scale.y += (0.56 - rightArm.scale.y) * 0.08;
  }
}

function stretchLimb(meta, dx, dy) {
  const { limb, foot, anchor, halfLength, baseAngle, side, stretchBoost } = meta;
  const baseScale = base.get(limb).scale;
  const ax = Math.min(1.5, Math.abs(dx) / 130);
  const ay = Math.min(2.1, Math.abs(dy) / 120);
  const px = THREE.MathUtils.clamp(dx / 180, -1, 1);
  const outward = Math.max(0, Math.abs(px) - 0.18);
  const newScaleY = baseScale.y + ay * stretchBoost + ax * 0.62;
  const squeezeX = Math.max(0.62, baseScale.x * (1 - Math.min(0.32, ay * 0.11)));
  const angle = baseAngle + px * 0.42 + side * outward * 0.16;
  const axis = localYAxis(angle);
  const newHalf = halfLength * newScaleY;
  const end = anchor.clone().sub(axis.clone().multiplyScalar(newHalf * 2));
  const center = anchor.clone().sub(axis.clone().multiplyScalar(newHalf));
  center.x += px * 0.1;

  limb.scale.lerp(new THREE.Vector3(squeezeX, newScaleY, baseScale.z), 0.27);
  limb.position.lerp(center, 0.27);
  limb.rotation.z += (angle - limb.rotation.z) * 0.25;

  if (foot) {
    const originalFoot = base.get(foot);
    foot.position.lerp(new THREE.Vector3(end.x, end.y - 0.08, originalFoot.position.z + 0.04), 0.26);
    foot.rotation.z += (angle * 0.55 - foot.rotation.z) * 0.24;
    foot.scale.lerp(new THREE.Vector3(originalFoot.scale.x * (1 + ax * 0.18), originalFoot.scale.y, originalFoot.scale.z), 0.2);
  }
}

function applyStretchVisual() {
  if (!stretch) return;
  const { part, dx, dy } = stretch;
  const ax = Math.min(1.4, Math.abs(dx) / 130);
  const ay = Math.min(1.6, Math.abs(dy) / 130);
  const px = THREE.MathUtils.clamp(dx / 170, -1, 1);
  const py = THREE.MathUtils.clamp(dy / 170, -1.1, 1.1);

  if (part === "head") {
    head.scale.lerp(new THREE.Vector3(1.32 + ax * 0.88, 1.25 + ay * 0.74, 1.04 - Math.min(0.28, ax * 0.12)), 0.22);
    head.position.lerp(new THREE.Vector3(px * 0.38, 1.12 + py * 0.44, 0), 0.22);
    neck.scale.lerp(new THREE.Vector3(0.46 + ax * 0.22, 0.34 + ay * 0.74, 0.38), 0.2);
  } else if (part === "body" || part === "belly") {
    body.scale.lerp(new THREE.Vector3(1.18 + ax * 0.9, 1.27 + ay * 1.1, 0.82), 0.2);
    belly.scale.lerp(new THREE.Vector3(1.05 + ax * 0.86, 0.82 + ay * 1.0, 0.72), 0.22);
    body.position.lerp(new THREE.Vector3(px * 0.2, -0.74 + py * 0.34, 0), 0.18);
  } else if (part === "leftArm") {
    stretchLimb(limbMeta.leftArm, dx, dy);
  } else if (part === "rightArm") {
    stretchLimb(limbMeta.rightArm, dx, dy);
  } else if (part === "leftLeg") {
    stretchLimb(limbMeta.leftLeg, dx, dy);
  } else if (part === "rightLeg") {
    stretchLimb(limbMeta.rightLeg, dx, dy);
  }
}

function animate(time = 0) {
  fit();
  resetTargets(time);
  applyMood(time);
  applyStretchVisual();

  if (Date.now() < thrownUntil) {
    const p = 1 - (thrownUntil - Date.now()) / 3100;
    rig.rotation.z = p * Math.PI * 5;
    rig.position.x = Math.sin(p * Math.PI * 1.6) * 0.5;
    if (p < 0.58) {
      rig.position.y = Math.sin(p * Math.PI) * 2.55;
    } else if (p < 0.74) {
      rig.position.y = -1.82 + Math.sin((p - 0.58) / 0.16 * Math.PI) * 0.08;
    } else {
      rig.position.y = -0.18 + Math.sin((1 - p) * Math.PI) * 0.28;
    }

    if (p > 0.6 && p < 0.74) {
      rig.scale.set(RIG_BASE_SCALE * 1.72, RIG_BASE_SCALE * 0.34, RIG_BASE_SCALE * 1.2);
      head.scale.lerp(new THREE.Vector3(1.62, 0.72, 1.08), 0.32);
      body.scale.lerp(new THREE.Vector3(1.58, 0.66, 0.94), 0.32);
      leftArm.scale.lerp(new THREE.Vector3(0.52, 0.42, 0.42), 0.26);
      rightArm.scale.lerp(new THREE.Vector3(0.52, 0.42, 0.42), 0.26);
      leftLeg.scale.lerp(new THREE.Vector3(0.54, 0.44, 0.42), 0.26);
      rightLeg.scale.lerp(new THREE.Vector3(0.54, 0.44, 0.42), 0.26);
      floor.scale.lerp(new THREE.Vector3(2.5, 0.34, 1), 0.34);
      floor.material.opacity += (0.24 - floor.material.opacity) * 0.25;
    } else {
      rig.scale.lerp(new THREE.Vector3(RIG_BASE_SCALE, RIG_BASE_SCALE, RIG_BASE_SCALE), 0.12);
      floor.scale.lerp(new THREE.Vector3(1.3, 0.22, 1), 0.1);
      floor.material.opacity += (0.12 - floor.material.opacity) * 0.1;
    }
  } else {
    rig.scale.lerp(new THREE.Vector3(RIG_BASE_SCALE, RIG_BASE_SCALE, RIG_BASE_SCALE), 0.08);
    floor.scale.lerp(new THREE.Vector3(1.3, 0.22, 1), 0.08);
    floor.material.opacity += (0.12 - floor.material.opacity) * 0.08;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.Natasha3D = {
  setMood(next) {
    mood = next === "watered" ? "idle" : next;
    if (next === "watered") wateredUntil = Date.now() + 5200;
    if (next === "birth") wateredUntil = Date.now() + 3000;
  },
  water(level) {
    waterLevel = Math.max(0, Math.min(3, level));
    wateredUntil = waterLevel > 0 ? Date.now() + 5200 : 0;
  },
  applyStretch(part, dx, dy) {
    stretch = { part, dx, dy };
    mood = "pinch";
  },
  clearStretch() {
    stretch = null;
  },
  throw() {
    thrownUntil = Date.now() + 3100;
  },
  reset() {
    mood = "idle";
    stretch = null;
    thrownUntil = 0;
    wateredUntil = 0;
    waterLevel = 0;
  }
};

shell.classList.add("has-three");
fit();
animate();
