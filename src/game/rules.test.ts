import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMagneticPull,
  calculateScoreIncrement,
  getMagneticParams,
  stepArenaPhysics,
  triggerMagneticPush,
} from './rules';
import { ArenaEntity, PlayerState, UpgradeLevels } from './types';

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    x: 0,
    z: 0,
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
    ...overrides,
  };
}

const defaultUpgrades: UpgradeLevels = {
  magnetRange: 1,
  pulseForce: 1,
  coreShield: 1,
};

test('calculateScoreIncrement scales with combo and applies diminishing returns on repeat hits', () => {
  assert.equal(calculateScoreIncrement(100, 1, 0), 100);
  assert.equal(calculateScoreIncrement(100, 3, 0), 300);
  const repeated = calculateScoreIncrement(100, 1, 2);
  assert.ok(repeated < 100 && repeated >= 20);
});

test('applyMagneticPull accelerates nearby metal balls toward the player orb and opens pull gates', () => {
  const player = makePlayer({ x: 0, z: 0, polarity: 'pull' });
  const entities: ArenaEntity[] = [
    {
      id: 'b1',
      type: 'metal_ball',
      x: 4,
      z: 0,
      vx: 0,
      vz: 0,
      radius: 0.65,
      mass: 1,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 0,
    },
    {
      id: 'g1',
      type: 'magnetic_gate',
      x: 2,
      z: 2,
      vx: 0,
      vz: 0,
      radius: 1,
      mass: 10,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 0,
      gatePolarity: 'pull',
      gateOpen: false,
    },
  ];

  const params = getMagneticParams(defaultUpgrades);
  const count = applyMagneticPull(player, entities, params, 0.05);
  assert.equal(count, 1);
  assert.ok(entities[0].vx < 0, 'Metal ball at +X should accelerate toward player at 0');
  assert.ok(entities[0].chargeLevel > 0);
  assert.equal(entities[1].gateOpen, true, 'Pull gate should open when polarity is pull');
});

test('triggerMagneticPush blasts metal objects outward and applies recoil to player', () => {
  const player = makePlayer({ x: 0, z: 0 });
  const entities: ArenaEntity[] = [
    {
      id: 'b1',
      type: 'metal_ball',
      x: 2.5,
      z: 0,
      vx: -3,
      vz: 0,
      radius: 0.65,
      mass: 1,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 0.8,
    },
  ];

  const params = getMagneticParams(defaultUpgrades);
  const res = triggerMagneticPush(player, entities, params);
  assert.equal(res.blastedCount, 1);
  assert.ok(entities[0].vx > 10, 'Metal ball should be blasted outward in +X direction');
  assert.ok(player.vx < 0, 'Player orb should experience opposite recoil in -X direction');
});

test('stepArenaPhysics shatters glass barrier and destroys target node on high-speed metal impact', () => {
  const player = makePlayer({ x: -5, z: -5 });
  const entities: ArenaEntity[] = [
    {
      id: 'ball1',
      type: 'metal_ball',
      x: 0,
      z: 0,
      vx: 22,
      vz: 0,
      radius: 0.65,
      mass: 1,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 1,
    },
    {
      id: 'glass1',
      type: 'glass_barrier',
      x: 1.0,
      z: 0,
      vx: 0,
      vz: 0,
      radius: 1.0,
      width: 0.8,
      depth: 3.0,
      mass: 10,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 0,
    },
    {
      id: 'ball2',
      type: 'metal_cube',
      x: 0,
      z: 4,
      vx: 16,
      vz: 0,
      radius: 0.8,
      mass: 2.2,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 1,
    },
    {
      id: 'target1',
      type: 'target_node',
      x: 1.1,
      z: 4,
      vx: 0,
      vz: 0,
      radius: 0.85,
      mass: 5,
      hp: 1,
      maxHp: 1,
      active: true,
      hitFlash: 0,
      chargeLevel: 0,
    },
  ];

  const params = getMagneticParams(defaultUpgrades);
  const events = stepArenaPhysics(
    player,
    entities,
    [],
    { width: 28, depth: 28, exitPortal: { x: 0, z: -10 }, exitUnlocked: true },
    { moveX: 0, moveZ: 0 },
    params,
    0.04
  );

  assert.equal(events.glassBroken, 1, 'Glass barrier should break on high-speed ball impact');
  assert.equal(entities[1].active, false);
  assert.equal(events.targetsHit, 1, 'Target node should be destroyed on heavy cube impact');
  assert.equal(entities[3].active, false);
});
