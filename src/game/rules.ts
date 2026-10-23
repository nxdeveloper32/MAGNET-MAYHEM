import {
  ArenaEntity,
  MagnetPolarity,
  PlayerState,
  UpgradeLevels,
  WallSegment,
} from './types';

export interface SimStepEvents {
  targetsHit: number;
  glassBroken: number;
  crystalsCollected: number;
  bladesDisabled: number;
  bumperHits: number;
  metalCollisions: number;
  playerDamaged: boolean;
  nearMisses: number;
  portalEntered: boolean;
  bossDamaged: boolean;
  spawnedBalls: ArenaEntity[];
  burstPositions: Array<{ x: number; z: number; color: number; count: number; heavy: boolean }>;
}

export interface MagneticParams {
  pullRadius: number;
  pullAccel: number;
  pushRadius: number;
  pushImpulse: number;
  maxObjectSpeed: number;
  maxPlayerSpeed: number;
}

export function getMagneticParams(upgrades: UpgradeLevels): MagneticParams {
  return {
    pullRadius: 8.5 + (upgrades.magnetRange - 1) * 1.1,
    pullAccel: 26 + (upgrades.pulseForce - 1) * 3.0,
    pushRadius: 9.2 + (upgrades.magnetRange - 1) * 1.1,
    pushImpulse: 22 + (upgrades.pulseForce - 1) * 2.8,
    maxObjectSpeed: 28,
    maxPlayerSpeed: 13.5,
  };
}

export function calculateScoreIncrement(
  basePoints: number,
  comboMultiplier: number,
  repeatHitCount = 0
): number {
  const diminishingFactor = Math.max(0.2, Math.pow(0.65, repeatHitCount));
  return Math.round(basePoints * Math.max(1, comboMultiplier) * diminishingFactor);
}

export function applyMagneticPull(
  player: PlayerState,
  entities: ArenaEntity[],
  params: MagneticParams,
  dt: number
): number {
  let affectedCount = 0;
  for (const ent of entities) {
    if (!ent.active) continue;

    if (ent.type === 'magnetic_gate') {
      ent.gateOpen = ent.gatePolarity === 'pull';
      continue;
    }

    if (ent.type !== 'metal_ball' && ent.type !== 'metal_cube') continue;

    const dx = player.x - ent.x;
    const dz = player.z - ent.z;
    const distSq = dx * dx + dz * dz;
    const dist = Math.sqrt(distSq);

    if (dist < params.pullRadius && dist > 0.05) {
      affectedCount++;
      const normX = dx / dist;
      const normZ = dz / dist;
      const falloff = 1 - Math.min(0.85, dist / params.pullRadius);
      // Orbit cushion so pulled objects cluster tightly around the orb without crushing it
      const desiredOrbit = player.radius + ent.radius + 0.55;
      if (dist > desiredOrbit) {
        const accel = (params.pullAccel * (0.45 + falloff * 0.85)) / Math.max(0.6, ent.mass);
        ent.vx += normX * accel * dt;
        ent.vz += normZ * accel * dt;
      } else {
        // Gentle orbital swirl when gathered close in the cluster
        const tangentX = -normZ;
        const tangentZ = normX;
        ent.vx = ent.vx * 0.88 + tangentX * 4.5 * dt;
        ent.vz = ent.vz * 0.88 + tangentZ * 4.5 * dt;
      }
      ent.chargeLevel = Math.min(1, ent.chargeLevel + dt * 2.8);
    } else {
      ent.chargeLevel = Math.max(0, ent.chargeLevel - dt * 1.5);
    }
  }
  return affectedCount;
}

export function triggerMagneticPush(
  player: PlayerState,
  entities: ArenaEntity[],
  params: MagneticParams
): { blastedCount: number; activatedLaunchers: number } {
  let blastedCount = 0;
  let activatedLaunchers = 0;
  let recoilX = 0;
  let recoilZ = 0;

  for (const ent of entities) {
    if (!ent.active) continue;

    if (ent.type === 'magnetic_gate') {
      ent.gateOpen = ent.gatePolarity === 'push';
      continue;
    }

    const dx = ent.x - player.x;
    const dz = ent.z - player.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (ent.type === 'launcher' && dist < params.pushRadius * 1.1) {
      ent.launcherTimer = 0.01; // Trigger immediate launch
      ent.hitFlash = 0.25;
      activatedLaunchers++;
      continue;
    }

    if (ent.type !== 'metal_ball' && ent.type !== 'metal_cube') continue;

    if (dist < params.pushRadius && dist > 0.001) {
      blastedCount++;
      const dirX = dx / dist;
      const dirZ = dz / dist;
      const closeness = 1 - Math.min(0.75, dist / params.pushRadius);
      const chargeBonus = 1 + ent.chargeLevel * 0.45;
      const impulse =
        ((params.pushImpulse * (0.65 + closeness * 0.65)) / Math.max(0.75, ent.mass * 0.8)) *
        chargeBonus;

      ent.vx = dirX * impulse;
      ent.vz = dirZ * impulse;
      ent.chargeLevel = 1.0;
      ent.hitFlash = 0.2;

      recoilX -= dirX * Math.min(3.5, impulse * 0.12);
      recoilZ -= dirZ * Math.min(3.5, impulse * 0.12);
    }
  }

  // Apply subtle Newton third-law magnetic recoil to the player orb
  player.vx += recoilX;
  player.vz += recoilZ;
  player.pushWaveTimer = 0.35;
  player.pushCooldown = 0.22;

  return { blastedCount, activatedLaunchers };
}

export function resolveWallCollision(
  obj: { x: number; z: number; vx: number; vz: number; radius: number },
  wall: WallSegment,
  restitution = 0.72
): boolean {
  const halfW = wall.width * 0.5;
  const halfD = wall.depth * 0.5;
  const closestX = Math.max(wall.x - halfW, Math.min(obj.x, wall.x + halfW));
  const closestZ = Math.max(wall.z - halfD, Math.min(obj.z, wall.z + halfD));

  const dx = obj.x - closestX;
  const dz = obj.z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq < obj.radius * obj.radius) {
    const dist = Math.sqrt(distSq);
    let nx = 0;
    let nz = 0;
    let overlap = obj.radius - dist;

    if (dist > 0.0001) {
      nx = dx / dist;
      nz = dz / dist;
    } else {
      const penX = halfW - Math.abs(obj.x - wall.x);
      const penZ = halfD - Math.abs(obj.z - wall.z);
      if (penX < penZ) {
        nx = obj.x < wall.x ? -1 : 1;
        overlap = penX + obj.radius;
      } else {
        nz = obj.z < wall.z ? -1 : 1;
        overlap = penZ + obj.radius;
      }
    }

    obj.x += nx * overlap;
    obj.z += nz * overlap;

    const vn = obj.vx * nx + obj.vz * nz;
    if (vn < 0) {
      obj.vx -= (1 + restitution) * vn * nx;
      obj.vz -= (1 + restitution) * vn * nz;
      return true;
    }
  }
  return false;
}

export function stepArenaPhysics(
  player: PlayerState,
  entities: ArenaEntity[],
  walls: WallSegment[],
  arenaBounds: { width: number; depth: number; exitPortal: { x: number; z: number }; exitUnlocked: boolean },
  inputVec: { moveX: number; moveZ: number },
  params: MagneticParams,
  dt: number
): SimStepEvents {
  const events: SimStepEvents = {
    targetsHit: 0,
    glassBroken: 0,
    crystalsCollected: 0,
    bladesDisabled: 0,
    bumperHits: 0,
    metalCollisions: 0,
    playerDamaged: false,
    nearMisses: 0,
    portalEntered: false,
    bossDamaged: false,
    spawnedBalls: [],
    burstPositions: [],
  };

  const clampedDt = Math.min(dt, 0.05);

  // Timers
  if (player.invulnerableTimer > 0) player.invulnerableTimer = Math.max(0, player.invulnerableTimer - clampedDt);
  if (player.pushCooldown > 0) player.pushCooldown = Math.max(0, player.pushCooldown - clampedDt);
  if (player.pushWaveTimer > 0) player.pushWaveTimer = Math.max(0, player.pushWaveTimer - clampedDt);

  // Player movement
  const moveAccel = 36;
  player.vx += inputVec.moveX * moveAccel * clampedDt;
  player.vz += inputVec.moveZ * moveAccel * clampedDt;

  // Damping
  const playerDamp = Math.exp(-4.2 * clampedDt);
  player.vx *= playerDamp;
  player.vz *= playerDamp;

  const pSpeed = Math.hypot(player.vx, player.vz);
  if (pSpeed > params.maxPlayerSpeed) {
    player.vx = (player.vx / pSpeed) * params.maxPlayerSpeed;
    player.vz = (player.vz / pSpeed) * params.maxPlayerSpeed;
  }

  player.x += player.vx * clampedDt;
  player.z += player.vz * clampedDt;

  // Magnetic Pull active step
  if (player.polarity === 'pull') {
    applyMagneticPull(player, entities, params, clampedDt);
  } else {
    for (const ent of entities) {
      if (ent.type === 'magnetic_gate' && player.polarity === 'idle') {
        ent.gateOpen = false;
      }
      ent.chargeLevel = Math.max(0, ent.chargeLevel - clampedDt * 1.2);
    }
  }

  // Clamp player to arena bounds
  const halfW = arenaBounds.width * 0.5 - player.radius;
  const halfD = arenaBounds.depth * 0.5 - player.radius;
  if (player.x < -halfW) { player.x = -halfW; player.vx = Math.abs(player.vx) * 0.5; }
  if (player.x > halfW) { player.x = halfW; player.vx = -Math.abs(player.vx) * 0.5; }
  if (player.z < -halfD) { player.z = -halfD; player.vz = Math.abs(player.vz) * 0.5; }
  if (player.z > halfD) { player.z = halfD; player.vz = -Math.abs(player.vz) * 0.5; }

  for (const w of walls) {
    resolveWallCollision(player, w, 0.45);
  }

  // Update entities
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    if (!ent.active) continue;

    if (ent.hitFlash > 0) {
      ent.hitFlash = Math.max(0, ent.hitFlash - clampedDt);
    }

    // Launcher spawning behavior
    if (ent.type === 'launcher') {
      const interval = ent.launcherInterval ?? 5.5;
      ent.launcherTimer = (ent.launcherTimer ?? interval) - clampedDt;
      if (ent.launcherTimer <= 0) {
        ent.launcherTimer = interval;
        const activeBalls = entities.filter((e) => e.active && e.type === 'metal_ball').length;
        if (activeBalls < 14) {
          const angle = ent.rotationY ?? 0;
          const dirX = Math.sin(angle);
          const dirZ = Math.cos(angle);
          const spawned: ArenaEntity = {
            id: `spawn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: 'metal_ball',
            x: ent.x + dirX * 1.5,
            z: ent.z + dirZ * 1.5,
            vx: dirX * 12,
            vz: dirZ * 12,
            radius: 0.65,
            mass: 1.0,
            hp: 1,
            maxHp: 1,
            active: true,
            hitFlash: 0.2,
            chargeLevel: 0.5,
          };
          events.spawnedBalls.push(spawned);
          events.burstPositions.push({ x: ent.x, z: ent.z, color: 0x00f0ff, count: 8, heavy: false });
        }
      }
    }

    // Dynamic physics objects
    if (ent.type === 'metal_ball' || ent.type === 'metal_cube') {
      const drag = ent.type === 'metal_cube' ? 1.85 : 0.95;
      const damp = Math.exp(-drag * clampedDt);
      ent.vx *= damp;
      ent.vz *= damp;

      const speed = Math.hypot(ent.vx, ent.vz);
      if (speed > params.maxObjectSpeed) {
        ent.vx = (ent.vx / speed) * params.maxObjectSpeed;
        ent.vz = (ent.vz / speed) * params.maxObjectSpeed;
      }

      ent.x += ent.vx * clampedDt;
      ent.z += ent.vz * clampedDt;

      // Arena perimeter bounce
      const bW = arenaBounds.width * 0.5 - ent.radius;
      const bD = arenaBounds.depth * 0.5 - ent.radius;
      if (ent.x < -bW) { ent.x = -bW; ent.vx = Math.abs(ent.vx) * 0.78; events.metalCollisions++; }
      if (ent.x > bW) { ent.x = bW; ent.vx = -Math.abs(ent.vx) * 0.78; events.metalCollisions++; }
      if (ent.z < -bD) { ent.z = -bD; ent.vz = Math.abs(ent.vz) * 0.78; events.metalCollisions++; }
      if (ent.z > bD) { ent.z = bD; ent.vz = -Math.abs(ent.vz) * 0.78; events.metalCollisions++; }

      for (const w of walls) {
        if (resolveWallCollision(ent, w, 0.78) && speed > 4) {
          events.metalCollisions++;
        }
      }
    }

    // Blade hazard movement (patrol / spin)
    if (ent.type === 'blade_hazard') {
      ent.rotationY = (ent.rotationY ?? 0) + clampedDt * 6.5;
      ent.x += ent.vx * clampedDt;
      ent.z += ent.vz * clampedDt;
      const bW = arenaBounds.width * 0.5 - ent.radius;
      const bD = arenaBounds.depth * 0.5 - ent.radius;
      if (ent.x < -bW || ent.x > bW) ent.vx *= -1;
      if (ent.z < -bD || ent.z > bD) ent.vz *= -1;
      for (const w of walls) {
        resolveWallCollision(ent, w, 1.0);
      }
    }
  }

  // Append newly launched metal balls
  for (const sb of events.spawnedBalls) {
    entities.push(sb);
  }

  // Entity-to-Entity & Player-to-Entity interactions
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    if (!a.active) continue;

    // 1. Player vs Entity
    const pdx = player.x - a.x;
    const pdz = player.z - a.z;
    const pDist = Math.hypot(pdx, pdz);
    const minPDist = player.radius + a.radius;

    if (a.type === 'crystal') {
      if (pDist < minPDist + 0.35) {
        a.active = false;
        events.crystalsCollected++;
        events.burstPositions.push({ x: a.x, z: a.z, color: 0x10b981, count: 12, heavy: false });
      }
      continue;
    }

    if (a.type === 'glass_barrier' || (a.type === 'magnetic_gate' && !a.gateOpen)) {
      const boxWall: WallSegment = {
        x: a.x,
        z: a.z,
        width: a.width ?? a.radius * 2,
        depth: a.depth ?? a.radius * 2,
      };
      resolveWallCollision(player, boxWall, 0.5);
    } else if (a.type === 'bumper') {
      if (pDist < minPDist && pDist > 0.001) {
        const nx = pdx / pDist;
        const nz = pdz / pDist;
        player.x = a.x + nx * minPDist;
        player.z = a.z + nz * minPDist;
        player.vx = nx * 12;
        player.vz = nz * 12;
        a.hitFlash = 0.25;
        events.bumperHits++;
      }
    } else if (a.type === 'blade_hazard') {
      if (pDist < minPDist) {
        if (player.invulnerableTimer <= 0) {
          player.hp = Math.max(0, player.hp - 1);
          player.invulnerableTimer = 1.25;
          const nx = pDist > 0.001 ? pdx / pDist : 0;
          const nz = pDist > 0.001 ? pdz / pDist : 1;
          player.vx = nx * 11;
          player.vz = nz * 11;
          events.playerDamaged = true;
          events.burstPositions.push({ x: player.x, z: player.z, color: 0xff2a85, count: 20, heavy: true });
        }
      } else if (pDist < minPDist + 0.9 && Math.hypot(player.vx, player.vz) > 5) {
        events.nearMisses++;
      }
    } else if (a.type === 'metal_ball' || a.type === 'metal_cube') {
      const relSpeed = Math.hypot(a.vx - player.vx, a.vz - player.vz);
      if (pDist < minPDist && pDist > 0.001) {
        const nx = pdx / pDist;
        const nz = pdz / pDist;
        const overlap = minPDist - pDist;
        player.x += nx * overlap * 0.4;
        player.z += nz * overlap * 0.4;
        a.x -= nx * overlap * 0.6;
        a.z -= nz * overlap * 0.6;

        // If un-pulled high-speed projectile slams into the player, deal damage
        if (player.polarity !== 'pull' && relSpeed > 19 && player.invulnerableTimer <= 0) {
          player.hp = Math.max(0, player.hp - 1);
          player.invulnerableTimer = 1.1;
          events.playerDamaged = true;
          events.burstPositions.push({ x: player.x, z: player.z, color: 0xff2a85, count: 16, heavy: true });
        }

        const vn = (player.vx - a.vx) * nx + (player.vz - a.vz) * nz;
        if (vn < 0) {
          const impulse = -1.5 * vn;
          player.vx += nx * impulse * 0.35;
          player.vz += nz * impulse * 0.35;
          a.vx -= nx * impulse * 0.65;
          a.vz -= nz * impulse * 0.65;
        }
      }
    }

    // 2. Dynamic Metal Object vs Other Entities
    if (a.type !== 'metal_ball' && a.type !== 'metal_cube') continue;

    const aSpeed = Math.hypot(a.vx, a.vz);

    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const b = entities[j];
      if (!b.active) continue;

      if (b.type === 'glass_barrier' || (b.type === 'magnetic_gate' && !b.gateOpen)) {
        const boxWall: WallSegment = {
          x: b.x,
          z: b.z,
          width: b.width ?? b.radius * 2,
          depth: b.depth ?? b.radius * 2,
        };
        const hit = resolveWallCollision(a, boxWall, 0.75);
        if (hit && b.type === 'glass_barrier') {
          const impactForce = aSpeed * a.mass;
          if (impactForce >= 7.5) {
            b.hp -= impactForce >= 14 ? 2 : 1;
            b.hitFlash = 0.25;
            if (b.hp <= 0) {
              b.active = false;
              events.glassBroken++;
              events.burstPositions.push({ x: b.x, z: b.z, color: 0x00f0ff, count: 22, heavy: true });
            } else {
              events.burstPositions.push({ x: a.x, z: a.z, color: 0x00f0ff, count: 8, heavy: false });
            }
          }
        }
        continue;
      }

      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.hypot(dx, dz);
      const minDist = a.radius + b.radius;

      if (dist >= minDist || dist < 0.0001) continue;

      const nx = dx / dist;
      const nz = dz / dist;

      // Metal vs Metal collision (avoid double processing by checking i < j)
      if (b.type === 'metal_ball' || b.type === 'metal_cube') {
        if (i < j) {
          const overlap = minDist - dist;
          const totalMass = a.mass + b.mass;
          a.x -= nx * overlap * (b.mass / totalMass);
          a.z -= nz * overlap * (b.mass / totalMass);
          b.x += nx * overlap * (a.mass / totalMass);
          b.z += nz * overlap * (a.mass / totalMass);

          const rvx = b.vx - a.vx;
          const rvz = b.vz - a.vz;
          const velAlongNormal = rvx * nx + rvz * nz;
          if (velAlongNormal < 0) {
            const e = 0.85;
            const jImpulse = (-(1 + e) * velAlongNormal) / (1 / a.mass + 1 / b.mass);
            a.vx -= (jImpulse / a.mass) * nx;
            a.vz -= (jImpulse / a.mass) * nz;
            b.vx += (jImpulse / b.mass) * nx;
            b.vz += (jImpulse / b.mass) * nz;

            if (Math.abs(velAlongNormal) > 3.5) {
              events.metalCollisions++;
              a.hitFlash = 0.12;
              b.hitFlash = 0.12;
              events.burstPositions.push({
                x: (a.x + b.x) * 0.5,
                z: (a.z + b.z) * 0.5,
                color: 0xf59e0b,
                count: 6,
                heavy: false,
              });
            }
          }
        }
        continue;
      }

      // Metal vs Bumper
      if (b.type === 'bumper') {
        a.x = b.x - nx * minDist;
        a.z = b.z - nz * minDist;
        const boostSpeed = Math.max(16, Math.min(params.maxObjectSpeed, aSpeed * 1.35));
        a.vx = -nx * boostSpeed;
        a.vz = -nz * boostSpeed;
        a.chargeLevel = 1.0;
        b.hitFlash = 0.3;
        events.bumperHits++;
        events.burstPositions.push({ x: b.x, z: b.z, color: 0xff2a85, count: 14, heavy: false });
        continue;
      }

      // Metal vs Target Node
      if (b.type === 'target_node') {
        a.x = b.x - nx * minDist;
        a.z = b.z - nz * minDist;
        a.vx = -nx * Math.max(8, aSpeed * 0.85);
        a.vz = -nz * Math.max(8, aSpeed * 0.85);

        if (aSpeed >= 4.5) {
          b.hp -= a.mass >= 2 ? 2 : 1;
          b.hitFlash = 0.35;
          b.hitCount = (b.hitCount ?? 0) + 1;
          if (b.hp <= 0) {
            b.active = false;
            events.targetsHit++;
            events.burstPositions.push({ x: b.x, z: b.z, color: 0xff7a00, count: 24, heavy: true });
          } else {
            events.burstPositions.push({ x: b.x, z: b.z, color: 0xff7a00, count: 10, heavy: false });
          }
        }
        continue;
      }

      // Metal vs Spinning Blade Hazard (disables blade weak point on strong impact!)
      if (b.type === 'blade_hazard') {
        a.x = b.x - nx * minDist;
        a.z = b.z - nz * minDist;
        a.vx = -nx * Math.max(9, aSpeed * 0.8);
        a.vz = -nz * Math.max(9, aSpeed * 0.8);
        if (aSpeed * a.mass >= 8.5) {
          b.hp -= a.mass >= 2 ? 2 : 1;
          b.hitFlash = 0.35;
          if (b.hp <= 0) {
            b.active = false;
            events.bladesDisabled++;
            events.burstPositions.push({ x: b.x, z: b.z, color: 0xff2a85, count: 26, heavy: true });
          }
        }
        continue;
      }

      // Metal vs Boss Core
      if (b.type === 'boss_core') {
        a.x = b.x - nx * minDist;
        a.z = b.z - nz * minDist;
        a.vx = -nx * Math.max(11, aSpeed * 0.9);
        a.vz = -nz * Math.max(11, aSpeed * 0.9);
        if (aSpeed >= 6.0) {
          b.hp -= a.mass >= 2 ? 2 : 1;
          b.hitFlash = 0.4;
          events.bossDamaged = true;
          if (b.hp <= 0) {
            b.active = false;
            events.targetsHit++;
            events.burstPositions.push({ x: b.x, z: b.z, color: 0xff2a85, count: 28, heavy: true });
          } else {
            events.burstPositions.push({ x: b.x, z: b.z, color: 0xff7a00, count: 16, heavy: true });
          }
        }
        continue;
      }
    }
  }

  // Check if player reached unlocked Exit Portal
  if (arenaBounds.exitUnlocked) {
    const edx = player.x - arenaBounds.exitPortal.x;
    const edz = player.z - arenaBounds.exitPortal.z;
    if (Math.hypot(edx, edz) < player.radius + 1.45) {
      events.portalEntered = true;
    }
  }

  return events;
}
