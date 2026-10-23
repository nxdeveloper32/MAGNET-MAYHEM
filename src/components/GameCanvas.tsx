import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundFX } from '../game/audio';
import { ARENA_LEVELS, ORB_SKINS } from '../game/levels';
import {
  buildArenaEnvironment,
  buildEntityMesh,
  buildExitPortalMesh,
  buildPlayerOrbMesh,
  createBrushedMetalBumpMap,
  createContactShadowGeometry,
  createHexGridTexture,
} from '../game/meshes';
import {
  calculateScoreIncrement,
  getMagneticParams,
  stepArenaPhysics,
  triggerMagneticPush,
} from '../game/rules';
import {
  ArenaEntity,
  ArenaLevelConfig,
  GameSettings,
  GameState,
  MagnetPolarity,
  PlayerState,
  RunSnapshot,
  UpgradeLevels,
} from '../game/types';

export interface HUDTelemetry {
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  crystalsEarned: number;
  targetsCleared: number;
  targetsTotal: number;
  pulsesUsed: number;
  elapsedSec: number;
  polarity: MagnetPolarity;
  clusterCount: number;
  tutorialStep: number;
}

interface GameCanvasProps {
  gameState: GameState;
  arenaId: number;
  skinId: string;
  upgrades: UpgradeLevels;
  settings: GameSettings;
  restartNonce: number;
  externalPullHeld: boolean;
  externalPushTriggerNonce: number;
  touchMoveVec: { x: number; z: number };
  onTelemetryUpdate: (telemetry: HUDTelemetry) => void;
  onRunComplete: (snapshot: RunSnapshot) => void;
  onTogglePause: () => void;
  onQuickRestart: () => void;
  onToggleMute: () => void;
  onStartFromKey: () => void;
}

// Pre-allocated scratch math objects outside loop (Zero GC)
const _camTarget = new THREE.Vector3();
const _camDesired = new THREE.Vector3();
const _dummyObj = new THREE.Object3D();
const _tempColor = new THREE.Color();

interface PooledParticle {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  scale: number;
  colorHex: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  arenaId,
  skinId,
  upgrades,
  settings,
  restartNonce,
  externalPullHeld,
  externalPushTriggerNonce,
  touchMoveVec,
  onTelemetryUpdate,
  onRunComplete,
  onTogglePause,
  onQuickRestart,
  onToggleMute,
  onStartFromKey,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable React callbacks and props in refs so canvas never unmounts
  const stateRef = useRef({
    gameState,
    arenaId,
    skinId,
    upgrades,
    settings,
    externalPullHeld,
    touchMoveVec,
    onTelemetryUpdate,
    onRunComplete,
    onTogglePause,
    onQuickRestart,
    onToggleMute,
    onStartFromKey,
  });

  useEffect(() => {
    stateRef.current = {
      gameState,
      arenaId,
      skinId,
      upgrades,
      settings,
      externalPullHeld,
      touchMoveVec,
      onTelemetryUpdate,
      onRunComplete,
      onTogglePause,
      onQuickRestart,
      onToggleMute,
      onStartFromKey,
    };
  }, [
    gameState,
    arenaId,
    skinId,
    upgrades,
    settings,
    externalPullHeld,
    touchMoveVec,
    onTelemetryUpdate,
    onRunComplete,
    onTogglePause,
    onQuickRestart,
    onToggleMute,
    onStartFromKey,
  ]);

  const rebuildLevelRef = useRef<((levelId: number, skinKey: string) => void) | null>(null);
  const triggerPushRef = useRef<(() => void) | null>(null);

  // Trigger Push when HUD button tapped
  useEffect(() => {
    if (externalPushTriggerNonce > 0 && stateRef.current.gameState === 'playing') {
      triggerPushRef.current?.();
    }
  }, [externalPushTriggerNonce]);

  // Rebuild arena when arenaId, skinId, or restartNonce changes
  useEffect(() => {
    rebuildLevelRef.current?.(arenaId, skinId);
  }, [arenaId, skinId, restartNonce]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL (SwiftShader / llvmpipe)
    const isSoftwareGl = (() => {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070f);
    scene.fog = new THREE.FogExp2(0x05070f, 0.021);

    // 2. Mandatory RoomEnvironment + PMREMGenerator for metallic PBR reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      52,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.5,
      140
    );
    camera.position.set(0, 17, 19);
    camera.lookAt(0, 0, 2);

    // 4. Studio 3-Point Warm/Cool Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
    keyLight.position.set(12, 24, 14);
    keyLight.castShadow = !isSoftwareGl;
    const d = 18;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 55;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.75);
    rimLight.position.set(-14, 12, -16);
    scene.add(rimLight);

    const playerPointLight = new THREE.PointLight(0x00f0ff, 2.2, 14, 1.8);
    playerPointLight.position.set(0, 2.2, 0);
    scene.add(playerPointLight);

    // 5. Shared Procedural Textures & Contact Shadow Prototype
    const hexTex = createHexGridTexture(renderer);
    const bumpMap = createBrushedMetalBumpMap();
    const shadowProto = createContactShadowGeometry();

    // 6. Pooled Particle Ring Buffer (InstancedMesh, capacity 160)
    const PARTICLE_CAP = 160;
    const particleGeo = new THREE.OctahedronGeometry(0.16, 0);
    const particleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, PARTICLE_CAP);
    particleInstanced.frustumCulled = false;
    scene.add(particleInstanced);

    const particlePool: PooledParticle[] = Array.from({ length: PARTICLE_CAP }, () => ({
      active: false,
      x: 0,
      y: -100,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.5,
      scale: 1,
      colorHex: 0x00f0ff,
    }));
    let particleWriteIdx = 0;

    const spawnBurst = (x: number, z: number, colorHex: number, count: number, heavy: boolean) => {
      const scaledCount = stateRef.current.settings.quality === 'balanced' ? Math.ceil(count * 0.6) : count;
      for (let i = 0; i < scaledCount; i++) {
        const p = particlePool[particleWriteIdx];
        particleWriteIdx = (particleWriteIdx + 1) % PARTICLE_CAP;
        const angle = Math.random() * Math.PI * 2;
        const speed = (heavy ? 5.5 : 3.2) + Math.random() * (heavy ? 9.5 : 5.5);
        p.active = true;
        p.x = x;
        p.y = 0.65 + Math.random() * 0.5;
        p.z = z;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2.5 + Math.random() * (heavy ? 6.5 : 4.0);
        p.vz = Math.sin(angle) * speed;
        p.maxLife = 0.32 + Math.random() * 0.35;
        p.life = p.maxLife;
        p.scale = heavy ? 1.35 : 0.95;
        p.colorHex = colorHex;
      }
    };

    // 7. Magnetic Trajectory Preview Lines (shows magnetic connection & Push vector preview)
    const MAX_PREVIEW_LINES = 24;
    const linePositions = new Float32Array(MAX_PREVIEW_LINES * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
    });
    const trajectoryLines = new THREE.LineSegments(lineGeo, lineMat);
    trajectoryLines.frustumCulled = false;
    scene.add(trajectoryLines);

    // 8. Mutable Simulation World State
    let currentArena: ArenaLevelConfig = ARENA_LEVELS[0];
    let envMeshGroup: THREE.Group | null = null;
    let portalObj: ReturnType<typeof buildExitPortalMesh> | null = null;
    let playerMeshObj: ReturnType<typeof buildPlayerOrbMesh> | null = null;
    const entityMeshes = new Map<string, THREE.Group>();

    const maxHpFromUpgrades = (upg: UpgradeLevels) =>
      3 + (upg.coreShield >= 3 ? 1 : 0) + (upg.coreShield >= 5 ? 1 : 0);

    const player: PlayerState = {
      x: 0,
      z: 9.5,
      vx: 0,
      vz: 0,
      radius: 0.9,
      hp: 3,
      maxHp: 3,
      invulnerableTimer: 0,
      polarity: 'idle',
      pushCooldown: 0,
      pushWaveTimer: 0,
      energy: 100,
      maxEnergy: 100,
      aimDirX: 0,
      aimDirZ: -1,
    };

    let entities: ArenaEntity[] = [];
    let score = 0;
    let combo = 1;
    let maxCombo = 1;
    let comboTimer = 0;
    let pulsesUsed = 0;
    let crystalsEarned = 0;
    let targetsCleared = 0;
    let targetsTotal = 3;
    let damageTaken = 0;
    let elapsedSec = 0;
    let tutorialStep = 0;
    let hitstopTimer = 0;
    let cameraTrauma = 0;
    let squashScaleX = 1;
    let squashScaleY = 1;
    let endingTimer = 0;
    let pendingSnapshot: RunSnapshot | null = null;
    let lastHudSyncTime = 0;

    // Input Tracking
    const keysPressed = new Set<string>();
    let mousePullHeld = false;

    const syncHUD = () => {
      const params = getMagneticParams(stateRef.current.upgrades);
      let clusterCount = 0;
      for (const e of entities) {
        if (e.active && (e.type === 'metal_ball' || e.type === 'metal_cube')) {
          if (Math.hypot(e.x - player.x, e.z - player.z) < params.pullRadius) {
            clusterCount++;
          }
        }
      }
      stateRef.current.onTelemetryUpdate({
        hp: player.hp,
        maxHp: player.maxHp,
        score,
        combo,
        crystalsEarned,
        targetsCleared,
        targetsTotal,
        pulsesUsed,
        elapsedSec,
        polarity: player.polarity,
        clusterCount,
        tutorialStep,
      });
    };

    const buildLevel = (levelId: number, skinKey: string) => {
      currentArena = ARENA_LEVELS.find((a) => a.id === levelId) ?? ARENA_LEVELS[0];
      const skin: OrbSkin = ORB_SKINS.find((s) => s.id === skinKey) ?? ORB_SKINS[0];

      // Clear previous meshes
      if (envMeshGroup) scene.remove(envMeshGroup);
      if (portalObj) scene.remove(portalObj.group);
      if (playerMeshObj) scene.remove(playerMeshObj.root);
      entityMeshes.forEach((m) => scene.remove(m));
      entityMeshes.clear();

      // Build Arena Environment
      envMeshGroup = buildArenaEnvironment(
        currentArena.arenaWidth,
        currentArena.arenaDepth,
        currentArena.walls,
        hexTex,
        isSoftwareGl
      );
      scene.add(envMeshGroup);

      // Build Exit Portal
      portalObj = buildExitPortalMesh(currentArena.exitPortal.x, currentArena.exitPortal.z);
      scene.add(portalObj.group);

      // Build Player Orb
      playerMeshObj = buildPlayerOrbMesh(skin, bumpMap);
      const shadow = new THREE.Mesh(shadowProto.geo, shadowProto.mat);
      shadow.position.y = 0.018;
      shadow.scale.setScalar(1.15);
      playerMeshObj.root.add(shadow);
      scene.add(playerMeshObj.root);

      // Reset Player State
      const maxHp = maxHpFromUpgrades(stateRef.current.upgrades);
      player.x = currentArena.playerSpawn.x;
      player.z = currentArena.playerSpawn.z;
      player.vx = 0;
      player.vz = 0;
      player.hp = maxHp;
      player.maxHp = maxHp;
      player.invulnerableTimer = 0.5;
      player.polarity = 'idle';
      player.pushCooldown = 0;
      player.pushWaveTimer = 0;

      playerMeshObj.root.position.set(player.x, 0, player.z);

      // Clone Entities & Build Meshes
      entities = currentArena.entities.map((cfg) => ({
        ...cfg,
        vx: cfg.type === 'blade_hazard' ? 4.8 : 0,
        vz: cfg.type === 'blade_hazard' ? 2.2 : 0,
        hitFlash: 0,
        chargeLevel: 0,
      }));

      for (const ent of entities) {
        const mesh = buildEntityMesh(ent, bumpMap, shadowProto, isSoftwareGl);
        entityMeshes.set(ent.id, mesh);
        scene.add(mesh);
      }

      // Reset Counters
      score = 0;
      combo = 1;
      maxCombo = 1;
      comboTimer = 0;
      pulsesUsed = 0;
      crystalsEarned = 0;
      targetsCleared = 0;
      targetsTotal = currentArena.requiredTargets;
      damageTaken = 0;
      elapsedSec = 0;
      tutorialStep = 0;
      hitstopTimer = 0;
      cameraTrauma = 0;
      squashScaleX = 1;
      squashScaleY = 1;
      endingTimer = 0;
      pendingSnapshot = null;

      keysPressed.clear();
      mousePullHeld = false;
      soundFX.stopPullHum();

      if (!isSoftwareGl) {
        renderer.compile(scene, camera);
      }
      syncHUD();
    };

    rebuildLevelRef.current = buildLevel;

    const executePushImpulse = () => {
      if (stateRef.current.gameState !== 'playing' || endingTimer > 0) return;
      if (player.pushCooldown > 0) return;

      const params = getMagneticParams(stateRef.current.upgrades);
      const { blastedCount, activatedLaunchers } = triggerMagneticPush(player, entities, params);
      pulsesUsed++;
      player.polarity = 'push';
      squashScaleX = 1.28;
      squashScaleY = 0.74;
      cameraTrauma = Math.min(1, cameraTrauma + (blastedCount > 0 ? 0.42 : 0.2));

      soundFX.playPushPulse(blastedCount);
      spawnBurst(player.x, player.z, 0xff7a00, blastedCount > 0 ? 22 : 12, blastedCount > 0);

      if (blastedCount > 0 || activatedLaunchers > 0) {
        hitstopTimer = 0.035;
      }
      syncHUD();
    };

    triggerPushRef.current = executePushImpulse;

    // Initial level build
    buildLevel(stateRef.current.arenaId, stateRef.current.skinId);

    // 9. Input Listeners (Window Keyboard + Canvas Mouse/Touch)
    const onKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const st = stateRef.current.gameState;

      if (st === 'title') {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          stateRef.current.onStartFromKey();
        }
        return;
      }

      if (code === 'Escape' || code === 'KeyP') {
        e.preventDefault();
        stateRef.current.onTogglePause();
        return;
      }

      if (code === 'KeyM') {
        e.preventDefault();
        stateRef.current.onToggleMute();
        return;
      }

      if (code === 'KeyR' && st === 'playing') {
        e.preventDefault();
        stateRef.current.onQuickRestart();
        return;
      }

      if (st !== 'playing') return;

      if ((code === 'Space' || code === 'KeyE') && !keysPressed.has(code)) {
        e.preventDefault();
        keysPressed.add(code);
        executePushImpulse();
        return;
      }

      keysPressed.add(code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.delete(e.code);
    };

    const onWindowBlur = () => {
      keysPressed.clear();
      mousePullHeld = false;
      soundFX.stopPullHum();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        keysPressed.clear();
        mousePullHeld = false;
        soundFX.stopPullHum();
      }
    };

    const onCanvasMouseDown = (e: MouseEvent) => {
      if (stateRef.current.gameState !== 'playing') return;
      if (e.button === 0) {
        mousePullHeld = true;
      } else if (e.button === 2) {
        e.preventDefault();
        executePushImpulse();
      }
    };

    const onCanvasMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        mousePullHeld = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    renderer.domElement.addEventListener('mousedown', onCanvasMouseDown);
    window.addEventListener('mouseup', onCanvasMouseUp);
    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    // ResizeObserver for lossless responsive viewport
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, entry.contentRect.width);
        const h = Math.max(1, entry.contentRect.height);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // 10. Software-WebGL Safe Animation Loop (`afterDraw` pacing on software GL)
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const totalElapsed = clock.getElapsedTime();
      const currentState = stateRef.current.gameState;
      const params = getMagneticParams(stateRef.current.upgrades);

      // Update Field Ring scale to match upgraded radius
      if (playerMeshObj) {
        const radiusScale = params.pullRadius / 8.5;
        playerMeshObj.fieldRing.scale.setScalar(radiusScale);
        playerMeshObj.fieldDisc.scale.setScalar(radiusScale);
      }

      if (currentState === 'title') {
        // Live World Camera Tour & Interactive Hero Showcase on Title Screen
        const orbitAngle = totalElapsed * 0.28;
        const camX = Math.sin(orbitAngle) * 18;
        const camZ = Math.cos(orbitAngle) * 18 + 3;
        camera.position.lerp(_camDesired.set(camX, 15.5, camZ), 1 - Math.exp(-4 * dt));
        camera.lookAt(0, 0.8, 0);

        // Gently animate floating crystals and orb rings on title stage
        if (playerMeshObj) {
          playerMeshObj.outerRing.rotation.z += dt * 1.4;
          playerMeshObj.innerRing.rotation.x += dt * 1.8;
          playerMeshObj.bodyGroup.position.y = 0.95 + Math.sin(totalElapsed * 3.0) * 0.12;
        }
      } else if (currentState === 'playing') {
        // Handle post-victory / post-defeat dramatic beat (0.45s)
        if (endingTimer > 0) {
          endingTimer -= dt;
          if (endingTimer <= 0 && pendingSnapshot) {
            const snap = pendingSnapshot;
            pendingSnapshot = null;
            stateRef.current.onRunComplete(snap);
          }
        }

        // Determine player polarity from held inputs
        const isPulling =
          mousePullHeld ||
          stateRef.current.externalPullHeld ||
          keysPressed.has('KeyQ') ||
          keysPressed.has('ShiftLeft') ||
          keysPressed.has('ShiftRight');

        if (player.pushWaveTimer > 0.15) {
          player.polarity = 'push';
        } else if (isPulling) {
          player.polarity = 'pull';
        } else {
          player.polarity = 'idle';
        }

        // Compute directional movement vector (Keyboard WASD/Arrows + Mobile Touch Joystick)
        let moveX = stateRef.current.touchMoveVec.x;
        let moveZ = stateRef.current.touchMoveVec.z;
        if (keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')) moveX -= 1;
        if (keysPressed.has('KeyD') || keysPressed.has('ArrowRight')) moveX += 1;
        if (keysPressed.has('KeyW') || keysPressed.has('ArrowUp')) moveZ -= 1;
        if (keysPressed.has('KeyS') || keysPressed.has('ArrowDown')) moveZ += 1;

        const moveLen = Math.hypot(moveX, moveZ);
        if (moveLen > 1) {
          moveX /= moveLen;
          moveZ /= moveLen;
        }

        // Advance simulation if not in hitstop freeze
        if (hitstopTimer > 0) {
          hitstopTimer = Math.max(0, hitstopTimer - dt);
        } else if (endingTimer <= 0) {
          elapsedSec += dt;

          // Decay combo timer
          if (combo > 1) {
            comboTimer -= dt;
            if (comboTimer <= 0) {
              combo = 1;
            }
          }

          const exitUnlocked = targetsCleared >= targetsTotal;
          const stepEvents = stepArenaPhysics(
            player,
            entities,
            currentArena.walls,
            {
              width: currentArena.arenaWidth,
              depth: currentArena.arenaDepth,
              exitPortal: currentArena.exitPortal,
              exitUnlocked,
            },
            { moveX, moveZ },
            params,
            dt
          );

          // Mount any newly spawned metal balls from launchers
          for (const sb of stepEvents.spawnedBalls) {
            const mesh = buildEntityMesh(sb, bumpMap, shadowProto, isSoftwareGl);
            entityMeshes.set(sb.id, mesh);
            scene.add(mesh);
          }

          // Spawn particle bursts
          for (const b of stepEvents.burstPositions) {
            spawnBurst(b.x, b.z, b.color, b.count, b.heavy);
          }

          // Audio & Score Events
          if (player.polarity === 'pull') {
            let countInRange = 0;
            for (const e of entities) {
              if (e.active && (e.type === 'metal_ball' || e.type === 'metal_cube')) {
                if (Math.hypot(e.x - player.x, e.z - player.z) < params.pullRadius) {
                  countInRange++;
                }
              }
            }
            soundFX.startPullHum(countInRange);
            if (countInRange > 0 && tutorialStep === 0) {
              tutorialStep = 1;
            }
          } else {
            soundFX.stopPullHum();
          }

          if (stepEvents.metalCollisions > 0) {
            soundFX.playMetalClank();
            combo = Math.min(10, combo + 1);
            maxCombo = Math.max(maxCombo, combo);
            comboTimer = 3.2;
            score += calculateScoreIncrement(25 * stepEvents.metalCollisions, combo);
          }

          if (stepEvents.bumperHits > 0) {
            soundFX.playMetalClank();
            combo = Math.min(10, combo + 1);
            maxCombo = Math.max(maxCombo, combo);
            comboTimer = 3.5;
            score += calculateScoreIncrement(60 * stepEvents.bumperHits, combo);
          }

          if (stepEvents.glassBroken > 0) {
            soundFX.playGlassBreak();
            hitstopTimer = 0.045;
            cameraTrauma = Math.min(1, cameraTrauma + 0.38);
            combo = Math.min(10, combo + 1);
            maxCombo = Math.max(maxCombo, combo);
            comboTimer = 4.0;
            score += calculateScoreIncrement(200 * stepEvents.glassBroken, combo);
          }

          if (stepEvents.bladesDisabled > 0) {
            soundFX.playTargetShatter(combo);
            hitstopTimer = 0.05;
            cameraTrauma = Math.min(1, cameraTrauma + 0.45);
            combo = Math.min(10, combo + 2);
            maxCombo = Math.max(maxCombo, combo);
            comboTimer = 4.2;
            score += calculateScoreIncrement(350 * stepEvents.bladesDisabled, combo);
          }

          if (stepEvents.targetsHit > 0 || stepEvents.bossDamaged) {
            targetsCleared += stepEvents.targetsHit;
            combo = Math.min(10, combo + stepEvents.targetsHit);
            maxCombo = Math.max(maxCombo, combo);
            comboTimer = 4.5;
            soundFX.playTargetShatter(combo);
            hitstopTimer = 0.055;
            cameraTrauma = Math.min(1, cameraTrauma + 0.52);
            score += calculateScoreIncrement(400 * Math.max(1, stepEvents.targetsHit), combo);
          }

          if (stepEvents.crystalsCollected > 0) {
            crystalsEarned += stepEvents.crystalsCollected;
            soundFX.playCrystalPickup();
            score += calculateScoreIncrement(150 * stepEvents.crystalsCollected, combo);
          }

          if (stepEvents.nearMisses > 0) {
            score += 15;
          }

          if (stepEvents.playerDamaged) {
            damageTaken++;
            combo = 1;
            soundFX.playPlayerHurt();
            hitstopTimer = 0.06;
            cameraTrauma = Math.min(1, cameraTrauma + 0.65);
            squashScaleX = 1.32;
            squashScaleY = 0.68;
          }

          // Check Defeat Condition (HP <= 0)
          if (player.hp <= 0 && endingTimer <= 0) {
            endingTimer = 0.45;
            soundFX.playOutcomeSting(false);
            const prevBest = stateRef.current.settings ? 0 : 0;
            pendingSnapshot = {
              victory: false,
              arenaId: currentArena.id,
              arenaName: currentArena.name,
              mode: currentArena.mode,
              score,
              bestScore: Math.max(score, prevBest),
              maxCombo,
              pulsesUsed,
              clearTimeSec: elapsedSec,
              targetsCleared,
              targetsTotal,
              crystalsEarned,
              damageTaken,
              reason: `Core containment breached with ${targetsTotal - targetsCleared} target(s) remaining.`,
            };
          }

          // Check Victory Condition (Entered Unlocked Exit Portal)
          if (stepEvents.portalEntered && endingTimer <= 0) {
            endingTimer = 0.4;
            soundFX.playOutcomeSting(true);
            // Mastery & Efficiency bonuses
            const noDamageBonus = damageTaken === 0 ? 500 : 0;
            const parBonus =
              currentArena.parPulses && pulsesUsed <= currentArena.parPulses ? 600 : 250;
            score += noDamageBonus + parBonus;
            crystalsEarned += 2; // Clear reward

            pendingSnapshot = {
              victory: true,
              arenaId: currentArena.id,
              arenaName: currentArena.name,
              mode: currentArena.mode,
              score,
              bestScore: score,
              maxCombo,
              pulsesUsed,
              clearTimeSec: elapsedSec,
              targetsCleared,
              targetsTotal,
              crystalsEarned,
              damageTaken,
              reason:
                damageTaken === 0
                  ? 'Flawless Mastery! Cleared arena with zero shield damage (+500 pts).'
                  : 'All magnetic objectives destroyed and portal stabilized.',
            };
          }
        }

        // Camera Follow with Exponential Damping & Trauma Shake
        cameraTrauma = Math.max(0, cameraTrauma - dt * 1.8);
        const shakeMag = stateRef.current.settings.reducedMotion
          ? 0
          : cameraTrauma * cameraTrauma * 0.65;
        const shakeX = (Math.random() - 0.5) * 2 * shakeMag;
        const shakeZ = (Math.random() - 0.5) * 2 * shakeMag;

        _camDesired.set(player.x * 0.65 + shakeX, 17.5, player.z * 0.72 + 12.5 + shakeZ);
        camera.position.lerp(_camDesired, 1 - Math.exp(-7.5 * dt));
        _camTarget.set(player.x * 0.5, 0.5, player.z * 0.5 - 1.5);
        camera.lookAt(_camTarget);
      }

      // 11. Sync 3D Visual Transforms, Squash-and-Stretch, and Polarity Lighting
      if (playerMeshObj) {
        playerMeshObj.root.position.set(player.x, 0, player.z);
        playerPointLight.position.set(player.x, 2.4, player.z);

        // Damp squash-and-stretch back to 1.0
        squashScaleX = THREE.MathUtils.damp(squashScaleX, 1, 10, dt);
        squashScaleY = THREE.MathUtils.damp(squashScaleY, 1, 10, dt);
        const speedBob = Math.hypot(player.vx, player.vz) * 0.015;
        playerMeshObj.bodyGroup.scale.set(
          squashScaleX + speedBob,
          squashScaleY - speedBob * 0.5,
          squashScaleX + speedBob
        );

        // Rotate orb toward velocity
        if (Math.hypot(player.vx, player.vz) > 0.4) {
          const targetAngle = Math.atan2(player.vx, player.vz) + Math.PI;
          playerMeshObj.bodyGroup.rotation.y = THREE.MathUtils.damp(
            playerMeshObj.bodyGroup.rotation.y,
            targetAngle,
            10,
            dt
          );
        }

        // Expressive eye scale & field ring color by polarity
        const ringMat = playerMeshObj.fieldRing.material as THREE.MeshBasicMaterial;
        const discMat = playerMeshObj.fieldDisc.material as THREE.MeshBasicMaterial;

        if (player.polarity === 'pull') {
          ringMat.color.setHex(0x00f0ff);
          ringMat.opacity = 0.68;
          discMat.color.setHex(0x00f0ff);
          discMat.opacity = 0.14;
          playerPointLight.color.setHex(0x00f0ff);
          playerPointLight.intensity = 3.2;
          playerMeshObj.outerRing.rotation.z += dt * 6.5;
          playerMeshObj.innerRing.rotation.x += dt * 8.0;
          playerMeshObj.leftEye.scale.set(1.15, 0.65, 1);
          playerMeshObj.rightEye.scale.set(1.15, 0.65, 1);
        } else if (player.polarity === 'push') {
          ringMat.color.setHex(0xff7a00);
          ringMat.opacity = 0.8;
          discMat.color.setHex(0xff7a00);
          discMat.opacity = 0.18;
          playerPointLight.color.setHex(0xff7a00);
          playerPointLight.intensity = 4.0;
          playerMeshObj.leftEye.scale.set(1.3, 1.35, 1);
          playerMeshObj.rightEye.scale.set(1.3, 1.35, 1);
        } else {
          ringMat.color.setHex(0x00f0ff);
          ringMat.opacity = 0.24;
          discMat.opacity = 0.04;
          playerPointLight.color.setHex(0x38bdf8);
          playerPointLight.intensity = 2.0;
          playerMeshObj.outerRing.rotation.z += dt * 1.5;
          playerMeshObj.innerRing.rotation.x += dt * 2.0;
          playerMeshObj.leftEye.scale.set(1, 1, 1);
          playerMeshObj.rightEye.scale.set(1, 1, 1);
        }

        // Expanding Push Shockwave animation
        const shockMat = playerMeshObj.pushShockwave.material as THREE.MeshBasicMaterial;
        if (player.pushWaveTimer > 0) {
          const progress = 1 - player.pushWaveTimer / 0.35;
          const waveScale = 1 + progress * (params.pushRadius * 0.85);
          playerMeshObj.pushShockwave.scale.setScalar(waveScale);
          shockMat.opacity = (1 - progress) * 0.85;
        } else {
          shockMat.opacity = 0;
        }
      }

      // Update Entity Meshes & Magnetic Trajectory Preview Lines
      let lineIdx = 0;
      const posAttr = trajectoryLines.geometry.getAttribute('position') as THREE.BufferAttribute;

      for (const ent of entities) {
        const mesh = entityMeshes.get(ent.id);
        if (!mesh) continue;
        mesh.visible = ent.active;
        if (!ent.active) continue;

        mesh.position.set(ent.x, 0, ent.z);

        const visualBody = mesh.getObjectByName('visualBody');
        if (visualBody) {
          if (ent.type === 'metal_ball' || ent.type === 'metal_cube') {
            visualBody.rotation.x += ent.vz * dt * 0.8;
            visualBody.rotation.z -= ent.vx * dt * 0.8;

            // Draw magnetic tether / trajectory line if within Pull/Push range
            const dist = Math.hypot(ent.x - player.x, ent.z - player.z);
            if (dist < params.pullRadius && lineIdx < MAX_PREVIEW_LINES) {
              const base = lineIdx * 6;
              linePositions[base] = player.x;
              linePositions[base + 1] = 0.75;
              linePositions[base + 2] = player.z;
              linePositions[base + 3] = ent.x;
              linePositions[base + 4] = 0.75;
              linePositions[base + 5] = ent.z;
              lineIdx++;
            }
          } else if (ent.type === 'crystal') {
            visualBody.rotation.y += dt * 2.2;
            visualBody.position.y = 0.85 + Math.sin(totalElapsed * 3.5 + ent.x) * 0.12;
          } else if (ent.type === 'blade_hazard') {
            visualBody.rotation.y = ent.rotationY ?? 0;
          } else if (ent.type === 'target_node' || ent.type === 'boss_core') {
            const core = visualBody.getObjectByName('targetCore');
            const halo = visualBody.getObjectByName('targetHalo');
            if (core) core.rotation.y += dt * 1.8;
            if (halo) {
              halo.rotation.x = Math.sin(totalElapsed * 2) * 0.6;
              halo.rotation.y += dt * 2.4;
            }
          }

          // Hit flash scale pulse
          const flashScale = ent.hitFlash > 0 ? 1 + ent.hitFlash * 0.45 : 1;
          visualBody.scale.setScalar(flashScale);
        }

        if (ent.type === 'magnetic_gate') {
          const beams = mesh.getObjectByName('gateBeams');
          if (beams) {
            beams.visible = !ent.gateOpen;
          }
        }
      }

      // Zero out unused trajectory lines
      for (let k = lineIdx; k < MAX_PREVIEW_LINES; k++) {
        const base = k * 6;
        linePositions[base] = 0;
        linePositions[base + 1] = -50;
        linePositions[base + 2] = 0;
        linePositions[base + 3] = 0;
        linePositions[base + 4] = -50;
        linePositions[base + 5] = 0;
      }
      posAttr.needsUpdate = true;
      (trajectoryLines.material as THREE.LineBasicMaterial).color.setHex(
        player.polarity === 'push' ? 0xff7a00 : 0x00f0ff
      );

      // Update Exit Portal visual state (Amber locked -> Neon Emerald unlocked)
      if (portalObj) {
        const unlocked = targetsCleared >= targetsTotal;
        const portalColor = unlocked ? 0x10b981 : 0xf59e0b;
        (portalObj.archRing.material as THREE.MeshStandardMaterial).color.setHex(portalColor);
        (portalObj.archRing.material as THREE.MeshStandardMaterial).emissive.setHex(portalColor);
        (portalObj.floorRing.material as THREE.MeshBasicMaterial).color.setHex(portalColor);
        (portalObj.vortexDisc.material as THREE.MeshBasicMaterial).color.setHex(portalColor);
        (portalObj.vortexDisc.material as THREE.MeshBasicMaterial).opacity = unlocked ? 0.48 : 0.16;
        portalObj.vortexDisc.rotation.z += dt * (unlocked ? 3.5 : 1.0);
      }

      // Update Pooled InstancedMesh Particles
      for (let i = 0; i < PARTICLE_CAP; i++) {
        const p = particlePool[i];
        if (!p.active) {
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0.001);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          _dummyObj.position.set(0, -100, 0);
          _dummyObj.scale.setScalar(0.001);
          _dummyObj.updateMatrix();
          particleInstanced.setMatrixAt(i, _dummyObj.matrix);
          continue;
        }
        p.vy -= 14 * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.1, p.y + p.vy * dt);
        p.z += p.vz * dt;

        const lifeRatio = p.life / p.maxLife;
        _dummyObj.position.set(p.x, p.y, p.z);
        _dummyObj.rotation.set(p.life * 6, p.life * 4, 0);
        _dummyObj.scale.setScalar(p.scale * lifeRatio);
        _dummyObj.updateMatrix();
        particleInstanced.setMatrixAt(i, _dummyObj.matrix);
        _tempColor.setHex(p.colorHex);
        particleInstanced.setColorAt(i, _tempColor);
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
      if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;

      // Throttle React HUD telemetry updates to ~10Hz during gameplay
      if (currentState === 'playing' && totalElapsed - lastHudSyncTime >= 0.1) {
        lastHudSyncTime = totalElapsed;
        syncHUD();
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      soundFX.stopPullHum();
      resizeObserver.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      renderer.domElement.removeEventListener('mousedown', onCanvasMouseDown);
      window.removeEventListener('mouseup', onCanvasMouseUp);
      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="webgl-canvas-container"
      className="fixed inset-0 w-screen h-screen overflow-hidden z-0"
    />
  );
};
