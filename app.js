import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const wrap = document.getElementById('scene');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8dbce9);
scene.fog = new THREE.Fog(0x8dbce9, 48, 95);

const camera = new THREE.PerspectiveCamera(40, wrap.clientWidth / wrap.clientHeight, 0.1, 150);
let wideScene = wrap.clientWidth / wrap.clientHeight > 1.8;
camera.position.set(2, wideScene ? 10 : 12, wideScene ? 19 : 32);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
wrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 3.2, 0);
controls.maxPolarAngle = Math.PI * 0.47;
controls.minDistance = 16;
controls.maxDistance = 44;

scene.add(new THREE.HemisphereLight(0xe5f2ff, 0x55514b, 2.1));
const sunlight = new THREE.DirectionalLight(0xfff1d5, 3.4);
sunlight.position.set(-12, 24, 15);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -24;
sunlight.shadow.camera.right = 24;
sunlight.shadow.camera.top = 18;
sunlight.shadow.camera.bottom = -18;
sunlight.shadow.bias = -0.0004;
scene.add(sunlight);

const fillLight = new THREE.DirectionalLight(0xc7dfff, 1.2);
fillLight.position.set(8, 12, -14);
scene.add(fillLight);

const mat = (color, metalness = 0.2, roughness = 0.55) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const steel = mat(0x68777c, 0.82, 0.3);
const brightSteel = mat(0xa6b1b2, 0.86, 0.23);
const darkSteel = mat(0x303b40, 0.72, 0.4);
const frameSteel = mat(0x414c50, 0.75, 0.38);
const green = mat(0x2a9c75, 0.35, 0.35);
const glass = new THREE.MeshPhysicalMaterial({
  color: 0x9bd6de,
  metalness: 0.15,
  roughness: 0.18,
  transparent: true,
  opacity: 0.65
});
const yellowPaint = mat(0xe9b936, 0.45, 0.36);
const beltMaterial = mat(0x242a2c, 0.12, 0.84);
const concrete = mat(0x9a9b97, 0.05, 0.94);
const buildingBlue = mat(0x2879a5, 0.22, 0.72);
const processPipeMaterial = mat(0xa4aead, 0.82, 0.26);
const vapourPipeMaterial = mat(0x9b8064, 0.76, 0.3);
const liquidPipeMaterial = mat(0xc18a3d, 0.74, 0.28);
const coolingMaterial = mat(0x5ca8bd, 0.55, 0.28);

function add(mesh, x, y, z, parent = scene) {
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function box(w, h, d, material, x, y, z, parent = scene) {
  return add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material), x, y, z, parent);
}

function cyl(topRadius, bottomRadius, height, material, x, y, z, segments = 32, parent = scene) {
  const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, segments);
  return add(new THREE.Mesh(geometry, material), x, y, z, parent);
}

function xCylinder(radius, length, material, x, y, z, segments = 48) {
  const mesh = cyl(radius, radius, length, material, x, y, z, segments);
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

function pipe(points, radius, material = processPipeMaterial) {
  const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 10, false), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function beam(start, end, radius, material = frameSteel) {
  const from = new THREE.Vector3(...start);
  const to = new THREE.Vector3(...end);
  const direction = to.clone().sub(from);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material
  );
  mesh.position.copy(from.add(to).multiplyScalar(0.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function torus(radius, tube, material, x, y, z, rotationX = 0) {
  const mesh = add(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 10, 64), material), x, y, z);
  mesh.rotation.x = rotationX;
  return mesh;
}

function addLabel(text, x, y, z, anchor, color = '#f6f7f5') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 144;
  const context = canvas.getContext('2d');
  context.fillStyle = 'rgba(24, 34, 39, 0.94)';
  context.strokeStyle = 'rgba(230, 238, 239, 0.9)';
  context.lineWidth = 5;
  context.beginPath();
  context.roundRect(5, 5, 630, 134, 25);
  context.fill();
  context.stroke();
  context.font = '700 39px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, 320, 73, 590);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  }));
  sprite.renderOrder = 10;
  sprite.scale.set(3.35, 0.76, 1);
  sprite.position.set(x, y, z);
  scene.add(sprite);
  const leaderGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(x, y - 0.4, z),
    new THREE.Vector3(...anchor)
  ]);
  const leader = new THREE.Line(
    leaderGeometry,
    new THREE.LineBasicMaterial({ color: 0x283a41, depthTest: false })
  );
  leader.renderOrder = 2;
  scene.add(leader);
  return sprite;
}

// Concrete plant yard and a simple industrial backdrop.
const yard = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), concrete);
yard.rotation.x = -Math.PI / 2;
yard.position.set(0, -0.13, 0);
yard.receiveShadow = true;
scene.add(yard);
box(31, 2.8, 0.42, buildingBlue, 0, 1.25, -7.3);
box(31.3, 0.18, 0.65, darkSteel, 0, 2.73, -7.3);
for (let x = -14.5; x <= 14.5; x += 2.4) {
  box(0.08, 2.65, 0.05, mat(0x5c9ab7, 0.1, 0.78), x, 1.25, -7.07);
}
for (let x = -16; x <= 16; x += 4) {
  box(0.035, 0.015, 17, mat(0x797e7b, 0, 1), x, -0.115, 0);
}

// Feed hopper and inclined conveyor with rollers, rails and support trestles.
box(1.65, 1.45, 1.75, darkSteel, -13.1, 0.85, 0.75);
box(1.3, 0.12, 1.35, brightSteel, -13.1, 1.62, 0.75);
cyl(0.72, 0.3, 0.85, steel, -13.1, 2.05, 0.75, 4);
box(0.62, 0.16, 0.62, darkSteel, -13.1, 2.5, 0.75);
const conveyorAngle = 0.31;
const conveyorCenter = [-9.15, 2.65, 0.75];
const conveyor = box(7.5, 0.22, 1.55, beltMaterial, ...conveyorCenter);
conveyor.rotation.z = conveyorAngle;
for (const z of [-0.08, 1.58]) {
  const rail = box(7.55, 0.13, 0.1, yellowPaint, -9.15, 2.83, z);
  rail.rotation.z = conveyorAngle;
}
for (let i = 0; i <= 10; i++) {
  const x = -12.75 + i * 0.72;
  const y = conveyorCenter[1] + (x - conveyorCenter[0]) * Math.tan(conveyorAngle);
  const roller = cyl(0.15, 0.15, 1.45, brightSteel, x, y - 0.08, 0.75, 20);
  roller.rotation.x = Math.PI / 2;
}
for (const [x, y] of [[-12.4, 1.55], [-10.2, 2.15], [-7.8, 2.95], [-6.0, 3.52]]) {
  for (const z of [0.1, 1.4]) {
    beam([x, 0.02, z], [x, y, z], 0.075);
  }
  beam([x, y * 0.55, 0.1], [x + 0.75, y * 0.55, 1.4], 0.045);
  beam([x, y * 0.55, 1.4], [x + 0.75, y * 0.55, 0.1], 0.045);
}
const conveyorMotor = box(0.72, 0.55, 0.72, green, -5.35, 3.7, 0.75);
xCylinder(0.22, 0.5, brightSteel, -4.95, 3.7, 0.75, 24);

// Reactor supports, access platform and horizontal sealed vessel.
box(7.5, 0.28, 4.25, darkSteel, -2.35, 0.32, 0);
for (const x of [-5.55, -4.1, -0.55, 0.9]) {
  for (const z of [-1.65, 1.65]) {
    beam([x, 0.48, z], [x, 3.7, z], 0.09);
  }
}
for (const x of [-5.55, -0.55]) {
  for (const z of [-1.65, 1.65]) {
    beam([x, 0.6, z], [x + 1.1, 2.7, z], 0.055);
    beam([x + 1.1, 2.7, z], [x, 0.6, z], 0.055);
  }
}
box(6.7, 0.16, 1.0, darkSteel, -2.35, 3.68, 1.65);
for (const x of [-5.5, -4, -2.5, -1, 0.7]) {
  beam([x, 3.76, 1.18], [x, 4.55, 1.18], 0.035, yellowPaint);
}
beam([-5.55, 4.52, 1.18], [0.7, 4.52, 1.18], 0.035, yellowPaint);
beam([-5.55, 4.1, 1.18], [0.7, 4.1, 1.18], 0.035, yellowPaint);
for (let i = 0; i < 9; i++) {
  const x = -5.4 + i * 0.7;
  beam([x, 0.1, 2.1], [x, 0.85, 2.1], 0.04, brightSteel);
  beam([x, 0.1, 2.1], [x + 0.35, 0.1, 2.1], 0.04, brightSteel);
}

const reactorMaterial = mat(0x59666c, 0.84, 0.28);
reactorMaterial.emissive = new THREE.Color(0x241006);
const reactorGlow = xCylinder(1.08, 5.55, reactorMaterial, -2.35, 2.45, 0);
for (const x of [-5.15, -3.8, -2.35, -0.9, 0.45]) {
  xCylinder(1.13, 0.13, brightSteel, x, 2.45, 0);
}
xCylinder(0.91, 0.18, darkSteel, -5.25, 2.45, 0);
xCylinder(0.91, 0.18, darkSteel, 0.55, 2.45, 0);
for (const x of [-4.7, -3.2, -1.7, -0.2]) {
  const sight = cyl(0.13, 0.13, 0.07, glass, x, 2.45, 1.095, 24);
  sight.rotation.x = Math.PI / 2;
}
for (const x of [-4.4, -0.4]) {
  xCylinder(0.2, 0.36, steel, x, 1.15, 0);
  for (const z of [-0.9, 0.9]) {
    cyl(0.34, 0.34, 0.24, brightSteel, x, 1.18, z, 32);
  }
}
box(0.95, 0.72, 0.75, green, 0.3, 0.75, 1.55);
cyl(0.23, 0.23, 0.3, brightSteel, 0.3, 1.28, 1.55, 24);
pipe([[-5.35, 3.78, 0.75], [-5.05, 3.95, 0.45], [-4.8, 3.55, 0], [-4.6, 3.25, 0]],
  0.18, processPipeMaterial);

// Cyclone separator and solid residue collection.
const cycloneX = 3.45;
cyl(0.68, 0.68, 1.9, brightSteel, cycloneX, 5.45, 0, 48);
cyl(0.68, 0.14, 1.5, steel, cycloneX, 3.75, 0, 48);
cyl(0.18, 0.18, 0.55, darkSteel, cycloneX, 2.72, 0, 32);
xCylinder(0.22, 1.15, brightSteel, 3.0, 6.42, 0);
for (const z of [-0.76, 0.76]) {
  for (const x of [2.78, 4.12]) {
    beam([x, 0.12, z], [x, 4.0, z], 0.065);
  }
}
box(1.8, 0.14, 1.55, darkSteel, cycloneX, 0.36, 0);
for (const x of [2.75, 4.15]) {
  for (const z of [-0.62, 0.62]) {
    beam([x, 0.42, z], [x + (x < cycloneX ? 0.25 : -0.25), 3.6, z], 0.05);
  }
}
const charBin = box(1.25, 1.0, 1.2, darkSteel, cycloneX, 1.0, 0);
box(1.4, 0.12, 1.34, brightSteel, cycloneX, 1.55, 0);
for (let i = 0; i < 12; i++) {
  const fragment = box(0.13, 0.08, 0.1, mat(0x151718, 0.05, 0.96),
    cycloneX - 0.46 + (i % 4) * 0.27, 1.64 + Math.floor(i / 4) * 0.035, -0.35 + (i % 3) * 0.27);
  fragment.rotation.y = i * 0.4;
}

// Tall condenser tower with steel frame, platforms, ladders and cooling coil.
const towerX = 8.0;
cyl(0.84, 0.84, 7.25, steel, towerX, 4.05, 0, 48);
cyl(0.9, 0.9, 0.17, brightSteel, towerX, 7.72, 0, 48);
cyl(0.9, 0.9, 0.17, brightSteel, towerX, 0.42, 0, 48);
for (const y of [1.2, 2.6, 4.1, 5.7, 7.3]) {
  torus(0.86, 0.045, brightSteel, towerX, y, 0, Math.PI / 2);
}
for (const x of [6.65, 9.35]) {
  for (const z of [-1.35, 1.35]) {
    beam([x, 0.12, z], [x, 8.15, z], 0.075);
  }
}
for (const y of [1.3, 3.5, 5.65, 7.75]) {
  box(3.0, 0.14, 2.9, darkSteel, towerX, y, 0);
  for (const x of [6.55, 9.45]) {
    beam([x, y + 0.08, -1.4], [x, y + 0.82, -1.4], 0.035, yellowPaint);
    beam([x, y + 0.08, 1.4], [x, y + 0.82, 1.4], 0.035, yellowPaint);
  }
  for (const z of [-1.4, 1.4]) {
    beam([6.55, y + 0.8, z], [9.45, y + 0.8, z], 0.035, yellowPaint);
    beam([6.55, y + 0.42, z], [9.45, y + 0.42, z], 0.025, yellowPaint);
  }
}
for (const z of [-1.35, 1.35]) {
  for (let x = 6.65; x < 9.3; x += 0.9) {
    beam([x, 0.12, z], [x + 0.9, 2.5, z], 0.04);
    beam([x + 0.9, 0.12, z], [x, 2.5, z], 0.04);
  }
}
for (const x of [6.82, 7.25]) {
  beam([x, 0.2, 1.48], [x, 7.5, 1.48], 0.035, brightSteel);
}
for (let y = 0.45; y < 7.4; y += 0.38) {
  beam([6.82, y, 1.48], [7.25, y, 1.48], 0.026, yellowPaint);
}
const coilPoints = [];
for (let i = 0; i <= 260; i++) {
  const t = i / 260;
  const angle = t * Math.PI * 18;
  coilPoints.push([
    towerX + 1.02 * Math.cos(angle),
    0.85 + t * 6.35,
    1.02 * Math.sin(angle)
  ]);
}
pipe(coilPoints, 0.055, coolingMaterial);

// Oil storage tank and spherical gas holder.
const tankX = 11.55;
cyl(1.15, 1.15, 3.25, mat(0x899397, 0.72, 0.3), tankX, 1.9, 0, 48);
const tankRoof = new THREE.Mesh(
  new THREE.SphereGeometry(1.15, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
  brightSteel
);
add(tankRoof, tankX, 3.52, 0);
for (const y of [0.42, 1.0, 2.6, 3.45]) {
  torus(1.16, 0.045, brightSteel, tankX, y, 0, Math.PI / 2);
}
for (const x of [tankX - 0.78, tankX + 0.78]) {
  for (const z of [-0.78, 0.78]) {
    beam([x, 0.05, z], [x, 0.45, z], 0.065);
  }
}
cyl(0.13, 0.13, 0.5, brightSteel, tankX, 4.0, 0, 24);
const levelGauge = box(0.13, 1.3, 0.12, glass, tankX + 1.18, 1.8, 0.15);
beam([tankX + 1.18, 1.12, 0.22], [tankX + 1.18, 2.5, 0.22], 0.035, yellowPaint);

const gasX = 14.65;
const gasY = 2.25;
const gasZ = 0.1;
const gasHolder = new THREE.Mesh(
  new THREE.SphereGeometry(1.62, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0x9ca7a9, metalness: 0.78, roughness: 0.28 })
);
add(gasHolder, gasX, gasY, gasZ);
torus(1.62, 0.035, brightSteel, gasX, gasY, gasZ, Math.PI / 2);
for (let i = 0; i < 4; i++) {
  const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
  beam([gasX + 1.18 * Math.cos(angle), 0.12, gasZ + 1.18 * Math.sin(angle)],
    [gasX + 0.72 * Math.cos(angle), 1.42, gasZ + 0.72 * Math.sin(angle)], 0.075);
}
beam([gasX - 1.2, 0.18, gasZ], [gasX + 1.2, 0.18, gasZ], 0.08, darkSteel);

// Visible process pipework links the reactor, separator, condenser and storage.
pipe([[-0.1, 3.3, 0], [0.8, 4.05, 0], [0.8, 6.35, 0], [2.85, 6.35, 0], [3.45, 6.25, 0]],
  0.16, vapourPipeMaterial);
pipe([[3.45, 6.45, 0], [4.1, 7.0, 0], [6.3, 7.0, 0], [7.4, 6.2, 0]],
  0.14, processPipeMaterial);
pipe([[8.4, 0.9, 0], [9.15, 0.9, 0], [9.65, 1.4, 0], [9.65, 4.15, 0], [11.55, 4.15, 0]],
  0.12, liquidPipeMaterial);
pipe([[8.55, 6.1, -0.1], [9.35, 7.05, -0.1], [11.6, 7.05, -0.1], [13.2, 5.1, 0], [14.65, 3.85, 0]],
  0.13, processPipeMaterial);
pipe([[3.45, 3.0, 0], [3.45, 1.95, 0], [3.45, 1.55, 0]], 0.11, darkSteel);

// Large convex lens and a conceptual sunlight-to-reactor energy path.
const lensX = -7.55;
const lensY = 7.55;
const lensZ = -2.15;
const lensMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb8e8ff,
  metalness: 0.08,
  roughness: 0.06,
  transmission: 0.78,
  thickness: 0.55,
  ior: 1.48,
  transparent: true,
  opacity: 0.56,
  side: THREE.DoubleSide
});
const convexLens = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), lensMaterial);
convexLens.scale.set(1.85, 0.28, 1.85);
add(convexLens, lensX, lensY, lensZ);
torus(1.83, 0.075, brightSteel, lensX, lensY - 0.05, lensZ, Math.PI / 2);
for (const x of [lensX - 1.5, lensX + 1.5]) {
  for (const z of [lensZ - 1.5, lensZ + 1.5]) {
    beam([x, 3.2, z], [x, lensY - 0.1, z], 0.065, frameSteel);
  }
}
beam([lensX - 1.7, 6.65, lensZ - 1.7], [lensX + 1.7, 6.65, lensZ - 1.7], 0.045, yellowPaint);
beam([lensX - 1.7, 6.65, lensZ + 1.7], [lensX + 1.7, 6.65, lensZ + 1.7], 0.045, yellowPaint);
const sunSourcePosition = new THREE.Vector3(-12.2, 11.6, -2.2);
const sunSourceMaterial = new THREE.MeshStandardMaterial({
  color: 0xffd66a,
  emissive: 0xffad27,
  emissiveIntensity: 1.8
});
const sunSource = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), sunSourceMaterial);
add(sunSource, sunSourcePosition.x, sunSourcePosition.y, sunSourcePosition.z);
const sunPointLight = new THREE.PointLight(0xffc64a, 2.2, 12);
sunPointLight.position.copy(sunSourcePosition);
scene.add(sunPointLight);

const receiverX = -2.35;
const receiverY = 3.72;
const receiverZ = 0;
cyl(0.22, 0.22, 0.24, brightSteel, receiverX, 3.65, receiverZ, 24);
const receiverMaterial = new THREE.MeshStandardMaterial({
  color: 0xffbd4b,
  emissive: 0xff681f,
  emissiveIntensity: 0.04
});
const receiver = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), receiverMaterial);
add(receiver, receiverX, receiverY, receiverZ);
const receiverLight = new THREE.PointLight(0xff9b32, 0, 7);
receiverLight.position.set(receiverX, receiverY, receiverZ);
scene.add(receiverLight);

const solarRayMaterial = new THREE.LineBasicMaterial({
  color: 0xffdf83,
  transparent: true,
  opacity: 0.12,
  depthTest: false
});
const solarRays = [];
for (let i = 0; i < 9; i++) {
  const angle = (i / 9) * Math.PI * 2;
  const lensPoint = new THREE.Vector3(
    lensX + 1.22 * Math.cos(angle),
    lensY - 0.12,
    lensZ + 1.22 * Math.sin(angle)
  );
  const points = [sunSourcePosition, lensPoint, new THREE.Vector3(receiverX, receiverY, receiverZ)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const ray = new THREE.Line(geometry, solarRayMaterial);
  ray.renderOrder = 3;
  scene.add(ray);
  solarRays.push(ray);
}
const energyCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(lensX, lensY - 0.18, lensZ),
  new THREE.Vector3(-6.0, 6.6, -1.55),
  new THREE.Vector3(-4.15, 5.25, -0.8),
  new THREE.Vector3(receiverX, receiverY, receiverZ)
]);
const energyBeamMaterial = new THREE.MeshBasicMaterial({
  color: 0xffbd4d,
  transparent: true,
  opacity: 0.16
});
const energyBeam = new THREE.Mesh(new THREE.TubeGeometry(energyCurve, 48, 0.055, 8, false), energyBeamMaterial);
scene.add(energyBeam);
const energyDots = [];
for (let i = 0; i < 8; i++) {
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.095, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffe083 })
  );
  dot.visible = false;
  scene.add(dot);
  energyDots.push({ mesh: dot, t: i / 8 });
}

// Three-colour stack light on the plant equipment.
const stackX = 0.9;
const stackZ = 2.1;
cyl(0.11, 0.11, 0.48, darkSteel, stackX, 4.12, stackZ, 16);
const lampColors = { red: 0xff332d, yellow: 0xffc928, green: 0x38e878 };
const signalLampMaterials = {};
const signalLampMeshes = {};
const signalLampPoints = {};
for (const [index, colorName] of ['red', 'yellow', 'green'].entries()) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(lampColors[colorName]).multiplyScalar(0.25),
    emissive: lampColors[colorName],
    emissiveIntensity: 0.025,
    roughness: 0.22,
    metalness: 0.08
  });
  signalLampMaterials[colorName] = material;
  signalLampMeshes[colorName] = add(
    new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), material),
    stackX,
    4.42 + index * 0.31,
    stackZ
  );
  signalLampPoints[colorName] = new THREE.PointLight(lampColors[colorName], 0, 2.5);
  signalLampPoints[colorName].position.set(stackX, 4.42 + index * 0.31, stackZ);
  scene.add(signalLampPoints[colorName]);
}

// Pipe flanges, support shoes and valve handwheels.
for (const [x, y, z] of [[0.8, 6.35, 0], [3.45, 6.35, 0], [7.4, 6.35, 0],
  [9.65, 1.4, 0], [11.55, 4.15, 0], [11.6, 7.05, -0.1]]) {
  const flange = cyl(0.24, 0.24, 0.13, brightSteel, x, y, z, 24);
  flange.rotation.z = Math.PI / 2;
}
for (const x of [0.8, 4.7, 7.4, 9.65, 12.4]) {
  beam([x, 0.08, -0.55], [x, 0.95, -0.55], 0.055);
  beam([x, 0.95, -0.55], [x, 0.95, 0.55], 0.055);
}
for (const [x, y, z] of [[0.8, 6.35, 0.35], [8.8, 6.65, -0.1], [9.65, 2.0, 0.2]]) {
  beam([x, y - 0.28, z], [x, y + 0.28, z], 0.035, yellowPaint);
  torus(0.23, 0.025, yellowPaint, x, y + 0.3, z, Math.PI / 2);
}

// Equipment labels with leader lines, arranged to match the reference image.
addLabel('FEEDSTOCK / PLASTIC WASTE', -12.0, 6.55, 0.2, [-12.7, 2.5, 0.75]);
addLabel('PYROLYSIS REACTOR', -2.35, 5.65, 0.3, [-2.35, 3.55, 0.6], '#ffe0a2');
addLabel('CYCLONE SEPARATOR', 3.45, 8.15, 0.3, [3.45, 6.55, 0]);
addLabel('CONDENSER SYSTEM', 8.0, 9.0, 0.2, [8.0, 7.85, 0], '#d4f4ff');
addLabel('OIL STORAGE TANK', 11.55, 5.4, 0.2, [11.55, 4.45, 0]);
addLabel('GAS HOLDER', 14.45, 5.25, 0.2, [14.65, 3.75, 0.1], '#d4f4ff');
addLabel('CARBON BLACK / CHAR', 3.45, 1.95, 1.4, [3.45, 1.55, 0]);
addLabel('BIG CONVEX LENS', lensX, 9.65, lensZ, [lensX, lensY, lensZ], '#ffdf83');

// Simulated feed and vapour markers are visual-only and appear while running.
const feedMaterial = mat(0x9b6d37, 0.08, 0.8);
const feedParticles = [];
for (let i = 0; i < 14; i++) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.13), feedMaterial);
  mesh.rotation.y = i * 0.7;
  mesh.visible = false;
  scene.add(mesh);
  feedParticles.push({ mesh, t: i / 14 });
}
const vapourCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-0.1, 3.3, 0),
  new THREE.Vector3(0.8, 4.05, 0),
  new THREE.Vector3(0.8, 6.35, 0),
  new THREE.Vector3(2.85, 6.35, 0),
  new THREE.Vector3(3.45, 6.25, 0),
  new THREE.Vector3(4.1, 7.0, 0),
  new THREE.Vector3(6.3, 7.0, 0),
  new THREE.Vector3(7.4, 6.2, 0)
]);
const vapourMaterial = new THREE.MeshBasicMaterial({ color: 0xffc56e });
const vapourDots = [];
for (let i = 0; i < 12; i++) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), vapourMaterial);
  mesh.visible = false;
  scene.add(mesh);
  vapourDots.push({ mesh, t: i / 12 });
}

let running = false;
let auto = false;
let elapsed = 0;
let startupElapsed = 0;
let hasStarted = false;
const solarRange = document.getElementById('sunRange');
const plasticRange = document.getElementById('plasticRange');

function setSignalLights(activeColor) {
  for (const color of ['red', 'yellow', 'green']) {
    const active = color === activeColor;
    document.querySelector(`[data-signal-light="${color}"]`).classList.toggle('lit', active);
    signalLampMaterials[color].emissiveIntensity = active ? 1.8 : 0.025;
    signalLampPoints[color].intensity = active ? 1.1 : 0;
  }
}

setSignalLights('red');

const descriptions = [
  ['01 · Sort and inspect feedstock', 'The concept starts with sorted, characterised material. Contaminants are separated before any process stage; PVC is excluded from this illustrative feed.'],
  ['02 · Metered feeding system', 'A covered conveyor represents controlled material transfer to the plant. The visual model does not specify feed preparation, throughput or equipment design.'],
  ['03 · Sealed reactor concept', 'The reactor represents an oxygen-limited conversion stage in a professionally engineered facility. This dashboard is not a reactor design or operating guide.'],
  ['04 · Cyclone separation concept', 'A cyclone symbol represents separation of entrained solids from a vapour stream. Actual separation performance depends on engineered equipment and the feed.'],
  ['05 · Condenser and gas handling', 'A condenser represents collection of condensable vapours. Remaining gases require a designed capture and treatment system; they must never be vented untreated.'],
  ['06 · Product collection and monitoring', 'Separate illustrative streams represent condensed liquid, gas, and solid residue. Products require characterisation; oil is not automatically ready for fuel use.']
];

document.querySelectorAll('.process-step, .flow-node').forEach(element => {
  element.addEventListener('click', () => {
    const step = Number(element.dataset.step);
    document.querySelectorAll('.process-step, .flow-node').forEach(item => {
      item.classList.toggle('selected', Number(item.dataset.step) === step);
    });
    document.getElementById('stepTitle').textContent = descriptions[step][0];
    document.getElementById('stepDescription').textContent = descriptions[step][1];
  });
});

document.getElementById('autoRotate').textContent = 'Auto rotate: OFF';
document.getElementById('autoRotate').classList.remove('active');
document.getElementById('autoRotate').onclick = () => {
  auto = !auto;
  controls.autoRotate = auto;
  document.getElementById('autoRotate').textContent = `Auto rotate: ${auto ? 'ON' : 'OFF'}`;
  document.getElementById('autoRotate').classList.toggle('active', auto);
};
controls.autoRotate = false;
controls.autoRotateSpeed = 0.35;

document.getElementById('resetView').onclick = () => {
  const wide = wrap.clientWidth / wrap.clientHeight > 1.8;
  wideScene = wide;
  camera.position.set(2, wide ? 10 : 12, wide ? 19 : 32);
  controls.target.set(0, 3.2, 0);
  controls.update();
};

document.getElementById('startBtn').onclick = () => {
  hasStarted = true;
  running = true;
  startupElapsed = 0;
  document.getElementById('runState').textContent = 'STARTING';
  setSignalLights('red');
};
document.getElementById('pauseBtn').onclick = () => {
  hasStarted = true;
  running = false;
  document.getElementById('runState').textContent = 'PAUSED';
  setSignalLights('red');
};

function updateMetrics() {
  const sun = Number(solarRange.value);
  const feed = Number(plasticRange.value) / 10;
  document.getElementById('sunValue').textContent = `${sun} W/m²`;
  document.getElementById('plasticValue').textContent = `${feed.toFixed(1)} kg/h`;
  document.getElementById('solarMetric').innerHTML = `${sun}<span> W/m²</span>`;
  document.getElementById('solarBar').style.width = `${sun / 1000 * 100}%`;
  if (!running || startupElapsed < 1.2) {
    document.getElementById('oilMetric').innerHTML = '0.00<span> kg/h</span>';
    document.getElementById('powerMetric').innerHTML = '0<span> W</span>';
    document.getElementById('oilBar').style.width = '0%';
    document.getElementById('powerBar').style.width = '0%';
    return;
  }
  const temperature = Math.round(25 + Math.min(1, sun / 1000) * 470 * (1 - Math.exp(-elapsed / 18)));
  const oil = feed * (sun / 1000) * 0.62;
  const power = Math.round(oil * 95);
  document.getElementById('tempMetric').innerHTML = `${temperature}<span> °C</span>`;
  document.getElementById('oilMetric').innerHTML = `${oil.toFixed(2)}<span> kg/h</span>`;
  document.getElementById('powerMetric').innerHTML = `${power}<span> W</span>`;
  document.getElementById('tempBar').style.width = `${Math.min(100, temperature / 650 * 100)}%`;
  document.getElementById('oilBar').style.width = `${Math.min(100, oil / 1.3 * 100)}%`;
  document.getElementById('powerBar').style.width = `${Math.min(100, power / 130 * 100)}%`;
}

solarRange.oninput = updateMetrics;
plasticRange.oninput = updateMetrics;

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (running) {
    elapsed += delta;
    startupElapsed += delta;
  }
  controls.autoRotate = auto;
  controls.update();
  const intensity = Number(solarRange.value) / 1000;
  const systemReady = running && startupElapsed >= 1.2;
  if (!running) {
    document.getElementById('runState').textContent = hasStarted ? 'PAUSED' : 'READY';
    setSignalLights('red');
  } else if (startupElapsed < 0.45) {
    document.getElementById('runState').textContent = 'STARTING';
    setSignalLights('red');
  } else if (startupElapsed < 1.2) {
    document.getElementById('runState').textContent = 'STARTING';
    setSignalLights('yellow');
  } else {
    document.getElementById('runState').textContent = 'RUNNING';
    setSignalLights('green');
  }
  const activeStep = systemReady ? Math.floor(elapsed / 5) % descriptions.length : -1;
  document.querySelectorAll('.process-step, .flow-node').forEach(element => {
    element.classList.toggle('flow-active', Number(element.dataset.step) === activeStep);
  });

  feedParticles.forEach(particle => {
    particle.t = (particle.t + delta * (systemReady ? 0.13 : 0)) % 1;
    const x = -12.55 + particle.t * 6.35;
    particle.mesh.position.set(x, 2.65 + (x + 9.15) * Math.tan(0.31), 0.75);
    particle.mesh.visible = systemReady;
  });
  vapourDots.forEach(particle => {
    particle.t = (particle.t + delta * (systemReady ? 0.085 : 0)) % 1;
    particle.mesh.position.copy(vapourCurve.getPointAt(particle.t));
    particle.mesh.visible = systemReady;
  });
  energyDots.forEach(particle => {
    particle.t = (particle.t + delta * (systemReady ? 0.22 : 0)) % 1;
    particle.mesh.position.copy(energyCurve.getPointAt(particle.t));
    particle.mesh.visible = systemReady;
  });
  solarRayMaterial.opacity = running ? 0.35 + intensity * 0.55 : 0.1;
  energyBeamMaterial.opacity = systemReady ? 0.35 + intensity * 0.6 : 0.12;
  receiverMaterial.emissiveIntensity = systemReady ? 0.3 + intensity * 1.5 : 0.04;
  receiverLight.intensity = systemReady ? 1.2 + intensity * 3 : 0;
  sunPointLight.intensity = running ? 1 + intensity * 2.5 : 0.6;
  reactorGlow.material.emissiveIntensity = systemReady ? 0.08 + intensity * 0.14 : 0.035;
  updateMetrics();
  renderer.render(scene, camera);
}

animate();
new ResizeObserver(() => {
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  const wide = width / height > 1.8;
  if (wide !== wideScene) {
    wideScene = wide;
    camera.position.set(2, wide ? 10 : 12, wide ? 19 : 32);
    controls.target.set(0, 3.2, 0);
    controls.update();
  }
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}).observe(wrap);
