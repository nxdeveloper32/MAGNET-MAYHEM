import * as THREE from 'three';
import { ArenaEntity, OrbSkin, WallSegment } from './types';

export function createHexGridTexture(renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Deep obsidian laboratory floor
  ctx.fillStyle = '#070B19';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle circuit grid & neon hex pattern
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
  ctx.lineWidth = 2.5;

  const r = 42;
  const dx = r * 1.5;
  const dy = r * Math.sqrt(3);

  for (let y = -r; y < 512 + r; y += dy) {
    for (let x = -r, col = 0; x < 512 + r * 2; x += dx, col++) {
      const cy = y + (col % 2 === 1 ? dy * 0.5 : 0);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = x + r * Math.cos(angle);
        const hy = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner accent dot
      ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
      ctx.beginPath();
      ctx.arc(x, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

export function createBrushedMetalBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 650; i++) {
    const y = Math.random() * 256;
    const shade = 100 + Math.floor(Math.random() * 55);
    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export function createContactShadowGeometry(): {
  geo: THREE.CircleGeometry;
  mat: THREE.MeshBasicMaterial;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.65, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.CircleGeometry(1, 24);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.75,
  });
  return { geo, mat };
}

/**
 * Builds the Hero Magnetic Orb (8-part composite procedural model)
 */
export function buildPlayerOrbMesh(skin: OrbSkin, bumpMap: THREE.CanvasTexture): {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  outerRing: THREE.Mesh;
  innerRing: THREE.Mesh;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  coreMesh: THREE.Mesh;
  fieldDisc: THREE.Mesh;
  fieldRing: THREE.Mesh;
  pushShockwave: THREE.Mesh;
} {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0.9;
  root.add(bodyGroup);

  // 1. Primary Silhouette: Glossy split hemisphere chassis
  const hullGeo = new THREE.SphereGeometry(0.76, 28, 22);
  const hullMat = new THREE.MeshStandardMaterial({
    color: skin.secondaryHex,
    metalness: 0.78,
    roughness: 0.18,
    bumpMap,
    bumpScale: 0.015,
  });
  const hullMesh = new THREE.Mesh(hullGeo, hullMat);
  hullMesh.castShadow = true;
  bodyGroup.add(hullMesh);

  // 2. Glowing magnetic core band around equator
  const coreBandGeo = new THREE.CylinderGeometry(0.78, 0.78, 0.2, 28);
  const coreMat = new THREE.MeshStandardMaterial({
    color: skin.primaryHex,
    emissive: skin.primaryHex,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.3,
  });
  const coreMesh = new THREE.Mesh(coreBandGeo, coreMat);
  bodyGroup.add(coreMesh);

  // 3. Secondary Read: Outer rotating magnetic gimbal ring
  const outerRingGeo = new THREE.TorusGeometry(0.98, 0.055, 12, 36);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.45,
    emissive: skin.primaryHex,
    emissiveIntensity: 0.45,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
  outerRing.rotation.x = Math.PI / 2;
  bodyGroup.add(outerRing);

  // 4. Secondary Read: Inner tilted gyroscope ring
  const innerRingGeo = new THREE.TorusGeometry(0.87, 0.04, 10, 32);
  const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
  innerRing.rotation.y = Math.PI / 4;
  bodyGroup.add(innerRing);

  // 5. Faceplate Visor (angled upward toward elevated camera for expressive character read)
  const visorGeo = new THREE.SphereGeometry(0.64, 20, 16, 0, Math.PI * 0.65, Math.PI * 0.18, Math.PI * 0.38);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x05070f,
    roughness: 0.08,
    metalness: 0.88,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.y = Math.PI * 0.18;
  bodyGroup.add(visor);

  // 6 & 7. Accent Details: Expressive Animated Eyes
  const eyeGeo = new THREE.CapsuleGeometry(0.095, 0.13, 8, 12);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: skin.coreHex,
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.23, 0.34, 0.65);
  leftEye.rotation.x = -0.35;
  bodyGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.23, 0.34, 0.65);
  rightEye.rotation.x = -0.35;
  bodyGroup.add(rightEye);

  // 8. Top Polarity Antenna Spire
  const spireGeo = new THREE.ConeGeometry(0.14, 0.34, 12);
  const spire = new THREE.Mesh(spireGeo, coreMat);
  spire.position.set(0, 0.88, 0);
  bodyGroup.add(spire);

  // Ground Magnetic Field Ring & Disc (visible before/during Pull & Push)
  const fieldRingGeo = new THREE.RingGeometry(8.2, 8.5, 64);
  fieldRingGeo.rotateX(-Math.PI / 2);
  const fieldRingMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const fieldRing = new THREE.Mesh(fieldRingGeo, fieldRingMat);
  fieldRing.position.y = 0.04;
  root.add(fieldRing);

  const fieldDiscGeo = new THREE.CircleGeometry(8.4, 48);
  fieldDiscGeo.rotateX(-Math.PI / 2);
  const fieldDiscMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.05,
    depthWrite: false,
  });
  const fieldDisc = new THREE.Mesh(fieldDiscGeo, fieldDiscMat);
  fieldDisc.position.y = 0.025;
  root.add(fieldDisc);

  // Push Expanding Shockwave Torus
  const shockGeo = new THREE.RingGeometry(0.8, 1.35, 48);
  shockGeo.rotateX(-Math.PI / 2);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xff7a00,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const pushShockwave = new THREE.Mesh(shockGeo, shockMat);
  pushShockwave.position.y = 0.25;
  root.add(pushShockwave);

  return {
    root,
    bodyGroup,
    outerRing,
    innerRing,
    leftEye,
    rightEye,
    coreMesh,
    fieldDisc,
    fieldRing,
    pushShockwave,
  };
}

/**
 * Builds composite 3D meshes for each ArenaEntity type
 */
export function buildEntityMesh(
  ent: ArenaEntity,
  bumpMap: THREE.CanvasTexture,
  shadowProto: { geo: THREE.CircleGeometry; mat: THREE.MeshBasicMaterial },
  isSoftwareGl: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.position.set(ent.x, 0, ent.z);

  // Soft radial contact shadow
  const shadow = new THREE.Mesh(shadowProto.geo, shadowProto.mat);
  shadow.position.y = 0.015;
  shadow.scale.setScalar(ent.radius * 1.25);
  group.add(shadow);

  if (ent.type === 'metal_ball') {
    const ballGroup = new THREE.Group();
    ballGroup.name = 'visualBody';
    ballGroup.position.y = ent.radius;

    // 1. Brushed chrome sphere core
    const sphereGeo = new THREE.SphereGeometry(ent.radius, 22, 18);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.88,
      roughness: 0.2,
      bumpMap,
      bumpScale: 0.012,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.castShadow = !isSoftwareGl;
    ballGroup.add(sphere);

    // 2 & 3. Intersecting neon seam bands (like reference image 1)
    const bandMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 1.5,
      roughness: 0.25,
    });
    const band1 = new THREE.Mesh(new THREE.TorusGeometry(ent.radius * 0.99, 0.045, 8, 28), bandMat);
    const band2 = new THREE.Mesh(new THREE.TorusGeometry(ent.radius * 0.99, 0.045, 8, 28), bandMat);
    band2.rotation.y = Math.PI / 2;
    ballGroup.add(band1, band2);

    group.add(ballGroup);
  } else if (ent.type === 'metal_cube') {
    const cubeGroup = new THREE.Group();
    cubeGroup.name = 'visualBody';
    const size = ent.radius * 1.45;
    cubeGroup.position.y = size * 0.5;

    // 1. Heavy dark titanium core block
    const coreBox = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshStandardMaterial({
        color: 0x334155,
        metalness: 0.85,
        roughness: 0.35,
        bumpMap,
        bumpScale: 0.02,
      })
    );
    coreBox.castShadow = !isSoftwareGl;
    cubeGroup.add(coreBox);

    // 2. Beveled outer industrial frame
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.15,
    });
    const plate1 = new THREE.Mesh(new THREE.BoxGeometry(size * 1.05, size * 0.72, size * 0.72), frameMat);
    const plate2 = new THREE.Mesh(new THREE.BoxGeometry(size * 0.72, size * 1.05, size * 0.72), frameMat);
    cubeGroup.add(plate1, plate2);

    // 3. Glowing amber power nodes on faces
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
    });
    const nodeCore = new THREE.Mesh(new THREE.BoxGeometry(size * 0.4, size * 0.4, size * 1.08), nodeMat);
    cubeGroup.add(nodeCore);

    group.add(cubeGroup);
  } else if (ent.type === 'crystal') {
    const crysGroup = new THREE.Group();
    crysGroup.name = 'visualBody';
    crysGroup.position.y = 0.85;

    // 1. Central emerald octahedron gem
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 1.5,
      roughness: 0.12,
      metalness: 0.25,
    });
    const mainGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.52, 0), gemMat);
    mainGem.scale.set(0.85, 1.35, 0.85);
    crysGroup.add(mainGem);

    // 2 & 3. Side crystal shards + orbit ring
    const shard1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gemMat);
    shard1.position.set(0.32, -0.15, 0.15);
    shard1.rotation.z = -0.35;
    const shard2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), gemMat);
    shard2.position.set(-0.32, -0.15, -0.15);
    shard2.rotation.z = 0.35;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    ring.rotation.x = Math.PI / 2;
    crysGroup.add(shard1, shard2, ring);
    group.add(crysGroup);
  } else if (ent.type === 'glass_barrier') {
    const w = ent.width ?? 4;
    const d = ent.depth ?? 0.8;
    const h = 2.1;

    // 1. Translucent cyan energy glass pane
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      roughness: 0.1,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.82,
      transparent: true,
      opacity: isSoftwareGl ? 0.48 : 0.88,
      depthWrite: false,
    });
    const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, h, d * 0.55), glassMat);
    pane.position.y = h * 0.5;
    pane.name = 'visualBody';
    group.add(pane);

    // 2 & 3. End-cap industrial emitters + top neon bar
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.35,
    });
    const leftPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, h + 0.2, 12), pylonMat);
    leftPylon.position.set(-w * 0.5 + 0.15, (h + 0.2) * 0.5, 0);
    const rightPylon = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, h + 0.2, 12), pylonMat);
    rightPylon.position.set(w * 0.5 - 0.15, (h + 0.2) * 0.5, 0);

    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.12, d * 0.7),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    topTrim.position.y = h + 0.05;
    group.add(leftPylon, rightPylon, topTrim);
  } else if (ent.type === 'magnetic_gate') {
    const w = ent.width ?? 6;
    const h = 2.0;
    const isPullGate = ent.gatePolarity === 'pull';
    const gateColor = isPullGate ? 0x00f0ff : 0xff7a00;

    const pylonMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 });
    const pLeft = new THREE.Mesh(new THREE.BoxGeometry(0.65, h, 0.85), pylonMat);
    pLeft.position.set(-w * 0.5, h * 0.5, 0);
    const pRight = new THREE.Mesh(new THREE.BoxGeometry(0.65, h, 0.85), pylonMat);
    pRight.position.set(w * 0.5, h * 0.5, 0);
    group.add(pLeft, pRight);

    // Laser beam group (scales down when gateOpen is true)
    const beamGroup = new THREE.Group();
    beamGroup.name = 'gateBeams';
    const beamMat = new THREE.MeshBasicMaterial({ color: gateColor });
    for (const yPos of [0.45, 1.0, 1.55]) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, w - 0.5, 10), beamMat);
      beam.rotation.z = Math.PI / 2;
      beam.position.y = yPos;
      beamGroup.add(beam);
    }
    group.add(beamGroup);
  } else if (ent.type === 'bumper') {
    const bmpGroup = new THREE.Group();
    bmpGroup.name = 'visualBody';

    // 1. Metallic base pedestal
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(ent.radius * 0.72, ent.radius * 0.9, 0.55, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 })
    );
    base.position.y = 0.275;
    bmpGroup.add(base);

    // 2. Neon magenta shock-ring cushion
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ent.radius * 0.88, 0.22, 14, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff2a85,
        emissive: 0xff2a85,
        emissiveIntensity: 1.6,
        roughness: 0.2,
      })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.65;
    bmpGroup.add(ring);

    // 3. Top cap dome
    const dome = new THREE.Mesh(
      new THREE.CylinderGeometry(ent.radius * 0.55, ent.radius * 0.75, 0.35, 20),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.15 })
    );
    dome.position.y = 0.85;
    bmpGroup.add(dome);
    group.add(bmpGroup);
  } else if (ent.type === 'blade_hazard') {
    const bladeGroup = new THREE.Group();
    bladeGroup.name = 'visualBody';
    bladeGroup.position.y = 0.65;

    // 1. Central vulnerable red/amber core
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(0.48, 0.48, 0.7, 20),
      new THREE.MeshStandardMaterial({
        color: 0xff2a85,
        emissive: 0xe11d48,
        emissiveIntensity: 1.8,
        roughness: 0.25,
      })
    );
    bladeGroup.add(core);

    // 2. Outer saw disc + 4 plasma teeth
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(ent.radius, ent.radius, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 })
    );
    bladeGroup.add(disc);

    const toothMat = new THREE.MeshBasicMaterial({ color: 0xff2a85 });
    for (let i = 0; i < 4; i++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(ent.radius * 2.15, 0.14, 0.24), toothMat);
      tooth.rotation.y = (Math.PI / 4) * i;
      bladeGroup.add(tooth);
    }
    group.add(bladeGroup);
  } else if (ent.type === 'launcher') {
    const launchGroup = new THREE.Group();
    launchGroup.name = 'visualBody';
    launchGroup.rotation.y = ent.rotationY ?? 0;

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 })
    );
    base.position.y = 0.45;
    launchGroup.add(base);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.52, 1.6, 18),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 })
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.65, 0.45);
    launchGroup.add(barrel);

    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.52, 0.08, 10, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    coil.position.set(0, 0.65, 1.1);
    launchGroup.add(coil);

    group.add(launchGroup);
  } else if (ent.type === 'target_node') {
    const targetGroup = new THREE.Group();
    targetGroup.name = 'visualBody';

    // 1. Pedestal base
    const ped = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.85, 0.45, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 })
    );
    ped.position.y = 0.225;
    targetGroup.add(ped);

    // 2. Glowing Solar Orange Target Sphere
    const bullseye = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.65, 1),
      new THREE.MeshStandardMaterial({
        color: 0xff7a00,
        emissive: 0xff5500,
        emissiveIntensity: 1.9,
        roughness: 0.15,
        metalness: 0.3,
      })
    );
    bullseye.position.y = 1.15;
    bullseye.name = 'targetCore';
    targetGroup.add(bullseye);

    // 3. Rotating outer halo ring
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.06, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    halo.position.y = 1.15;
    halo.name = 'targetHalo';
    targetGroup.add(halo);

    group.add(targetGroup);
  } else if (ent.type === 'boss_core') {
    const bossGroup = new THREE.Group();
    bossGroup.name = 'visualBody';

    const housing = new THREE.Mesh(
      new THREE.CylinderGeometry(ent.radius * 0.9, ent.radius * 1.1, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f122b, metalness: 0.88, roughness: 0.3 })
    );
    housing.position.y = 0.45;
    bossGroup.add(housing);

    const reactor = new THREE.Mesh(
      new THREE.SphereGeometry(ent.radius * 0.68, 24, 18),
      new THREE.MeshStandardMaterial({
        color: 0xff2a85,
        emissive: 0xff2a85,
        emissiveIntensity: 2.2,
        roughness: 0.15,
      })
    );
    reactor.position.y = 1.35;
    reactor.name = 'targetCore';
    bossGroup.add(reactor);

    const shieldRing = new THREE.Mesh(
      new THREE.TorusGeometry(ent.radius * 0.95, 0.09, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.2 })
    );
    shieldRing.position.y = 1.35;
    shieldRing.name = 'targetHalo';
    bossGroup.add(shieldRing);

    group.add(bossGroup);
  }

  return group;
}

/**
 * Builds the Exit Portal Stargate Arch at the end of the arena
 */
export function buildExitPortalMesh(x: number, z: number): {
  group: THREE.Group;
  vortexDisc: THREE.Mesh;
  archRing: THREE.Mesh;
  floorRing: THREE.Mesh;
} {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  // Base platform
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.4, 0.28, 32),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.25 })
  );
  pad.position.y = 0.14;
  group.add(pad);

  // Glowing floor beacon ring
  const floorRingGeo = new THREE.RingGeometry(1.65, 1.95, 36);
  floorRingGeo.rotateX(-Math.PI / 2);
  const floorRingMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
  });
  const floorRing = new THREE.Mesh(floorRingGeo, floorRingMat);
  floorRing.position.y = 0.3;
  group.add(floorRing);

  // Vertical Stargate Arch Torus
  const archRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.75, 0.16, 16, 40),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  archRing.position.y = 1.95;
  group.add(archRing);

  // Swirling inner vortex disc
  const vortexDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  vortexDisc.position.y = 1.95;
  group.add(vortexDisc);

  return { group, vortexDisc, archRing, floorRing };
}

/**
 * Builds inner arena walls and surrounding futuristic neon monolith skyline
 */
export function buildArenaEnvironment(
  width: number,
  depth: number,
  walls: WallSegment[],
  hexTex: THREE.CanvasTexture,
  isSoftwareGl: boolean
): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. Playable Arena Floor
  const floorGeo = new THREE.PlaneGeometry(width, depth);
  floorGeo.rotateX(-Math.PI / 2);
  hexTex.repeat.set(width / 3.5, depth / 3.5);
  const floorMat = new THREE.MeshStandardMaterial({
    map: hexTex,
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.22,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = !isSoftwareGl;
  envGroup.add(floorMesh);

  // 2. Arena Perimeter Curb with Neon Edge Trim
  const borderWallMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.82,
    roughness: 0.35,
  });
  const neonTrimMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

  const perimeterConfigs = [
    { x: 0, z: -depth * 0.5 - 0.4, w: width + 1.6, d: 0.8 },
    { x: 0, z: depth * 0.5 + 0.4, w: width + 1.6, d: 0.8 },
    { x: -width * 0.5 - 0.4, z: 0, w: 0.8, d: depth },
    { x: width * 0.5 + 0.4, z: 0, w: 0.8, d: depth },
  ];

  for (const p of perimeterConfigs) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(p.w, 1.1, p.d), borderWallMat);
    curb.position.set(p.x, 0.55, p.z);
    envGroup.add(curb);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(p.w * 0.99, 0.1, p.d * 0.45), neonTrimMat);
    trim.position.set(p.x, 1.12, p.z);
    envGroup.add(trim);
  }

  // 3. Interior Wall Segments with Neon Trim (matching reference images 1 & 11)
  for (const w of walls) {
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w.width, 1.5, w.depth), borderWallMat);
    wallMesh.position.set(w.x, 0.75, w.z);
    wallMesh.castShadow = !isSoftwareGl;
    wallMesh.receiveShadow = !isSoftwareGl;
    envGroup.add(wallMesh);

    const trimColor = w.neonColor ?? 0x00f0ff;
    const trim = new THREE.Mesh(
      new THREE.BoxGeometry(w.width + 0.06, 0.12, w.depth + 0.06),
      new THREE.MeshBasicMaterial({ color: trimColor })
    );
    trim.position.set(w.x, 1.52, w.z);
    envGroup.add(trim);
  }

  // 4. Surrounding Distant Cyber-Laboratory Monoliths (InstancedMesh for zero draw-call bloat)
  const monolithCount = 36;
  const monoGeo = new THREE.BoxGeometry(1, 1, 1);
  const monoMat = new THREE.MeshStandardMaterial({
    color: 0x0b132b,
    roughness: 0.55,
    metalness: 0.4,
  });
  const instancedMonoliths = new THREE.InstancedMesh(monoGeo, monoMat, monolithCount);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let i = 0; i < monolithCount; i++) {
    const angle = (i / monolithCount) * Math.PI * 2;
    const dist = Math.max(width, depth) * 0.78 + (i % 3) * 5.5;
    const mx = Math.cos(angle) * dist;
    const mz = Math.sin(angle) * dist;
    const mh = 6 + ((i * 7) % 14);
    const mw = 2.8 + (i % 4) * 0.9;
    dummy.position.set(mx, mh * 0.35 - 4, mz);
    dummy.scale.set(mw, mh, mw);
    dummy.rotation.y = (i % 4) * (Math.PI / 4);
    dummy.updateMatrix();
    instancedMonoliths.setMatrixAt(i, dummy.matrix);

    color.setHex(i % 2 === 0 ? 0x0f172a : 0x1e1b4b);
    instancedMonoliths.setColorAt(i, color);
  }
  instancedMonoliths.instanceMatrix.needsUpdate = true;
  if (instancedMonoliths.instanceColor) instancedMonoliths.instanceColor.needsUpdate = true;
  instancedMonoliths.computeBoundingSphere();
  envGroup.add(instancedMonoliths);

  return envGroup;
}
