import { ArenaLevelConfig, OrbSkin } from './types';

export const ORB_SKINS: OrbSkin[] = [
  {
    id: 'neon_cyan',
    name: 'Cyber Volt',
    roleDesc: 'Standard issue high-visibility cyan laboratory core',
    primaryHex: 0x00f0ff,
    secondaryHex: 0x1e293b,
    coreHex: 0x38bdf8,
    cssColor: '#00F0FF',
    cost: 0,
  },
  {
    id: 'solar_flare',
    name: 'Solar Pulse',
    roleDesc: 'High-contrast amber gold housing with plasma rings',
    primaryHex: 0xff7a00,
    secondaryHex: 0x27171a,
    coreHex: 0xfacc15,
    cssColor: '#FF7A00',
    cost: 4,
  },
  {
    id: 'void_magenta',
    name: 'Hyperion Pink',
    roleDesc: 'Overclocked magenta shell with anodized titanium trim',
    primaryHex: 0xff2a85,
    secondaryHex: 0x1f122b,
    coreHex: 0xf43f5e,
    cssColor: '#FF2A85',
    cost: 8,
  },
  {
    id: 'quantum_emerald',
    name: 'Quantum Jade',
    roleDesc: 'Experimental superconductor casing with emerald emitters',
    primaryHex: 0x10b981,
    secondaryHex: 0x0f2922,
    coreHex: 0x34d399,
    cssColor: '#10B981',
    cost: 12,
  },
];

export const ARENA_LEVELS: ArenaLevelConfig[] = [
  {
    id: 1,
    name: 'Induction Chamber',
    subtitle: 'Mode A · Arena Escape (Interactive Tutorial)',
    mode: 'escape',
    objectiveText: 'Shatter 3 Calibration Targets with Magnetic Push, then enter the Exit Portal',
    tutorialHints: [
      'STEP 1: Hold Left Mouse / [Q] / Left Touch Zone to PULL metal spheres into an orbit around you.',
      'STEP 2: Press [SPACE] / Right Click / Right Touch Zone to PUSH and blast them through the Glass Barrier & Targets!',
      'STEP 3: Once all 3 Targets shatter, glide into the glowing Exit Portal at the north end.',
    ],
    arenaWidth: 26,
    arenaDepth: 28,
    playerSpawn: { x: 0, z: 9.5 },
    exitPortal: { x: 0, z: -11.2 },
    requiredTargets: 3,
    walls: [
      { x: -7.5, z: 2, width: 4, depth: 1.5, neonColor: 0x00f0ff },
      { x: 7.5, z: 2, width: 4, depth: 1.5, neonColor: 0x00f0ff },
    ],
    entities: [
      // Metal balls ready to pull right in front of spawn
      { id: 'b1', type: 'metal_ball', x: -3.2, z: 6.2, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b2', type: 'metal_ball', x: 0, z: 5.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b3', type: 'metal_ball', x: 3.2, z: 6.2, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b4', type: 'metal_ball', x: -2.0, z: 3.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b5', type: 'metal_ball', x: 2.0, z: 3.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      // Breakable glass barrier across center
      { id: 'g1', type: 'glass_barrier', x: 0, z: 2.0, radius: 1.2, width: 10.5, depth: 0.9, mass: 10, hp: 1, maxHp: 1, active: true },
      // 3 Target nodes behind the glass
      { id: 't1', type: 'target_node', x: -5.2, z: -3.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't2', type: 'target_node', x: 0, z: -4.8, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't3', type: 'target_node', x: 5.2, z: -3.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      // Collectible energy crystals
      { id: 'c1', type: 'crystal', x: -4.5, z: 7.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: 4.5, z: 7.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: 0, z: -8.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
  {
    id: 2,
    name: 'Prism Shatterbay',
    subtitle: 'Mode A · Arena Escape (Heavy Cubes & Magnetic Gates)',
    mode: 'escape',
    objectiveText: 'Use Heavy Metal Cubes, Bumpers, and Magnetic Gates to destroy 4 Targets',
    arenaWidth: 28,
    arenaDepth: 30,
    playerSpawn: { x: 0, z: 11.0 },
    exitPortal: { x: 0, z: -12.0 },
    requiredTargets: 4,
    walls: [
      { x: -6.5, z: -2.0, width: 5.5, depth: 1.4, neonColor: 0xff2a85 },
      { x: 6.5, z: -2.0, width: 5.5, depth: 1.4, neonColor: 0xff2a85 },
    ],
    entities: [
      { id: 'mc1', type: 'metal_cube', x: -2.8, z: 7.2, radius: 0.85, mass: 2.0, hp: 1, maxHp: 1, active: true },
      { id: 'mc2', type: 'metal_cube', x: 2.8, z: 7.2, radius: 0.85, mass: 2.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb1', type: 'metal_ball', x: 0, z: 6.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb2', type: 'metal_ball', x: -5.0, z: 4.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb3', type: 'metal_ball', x: 5.0, z: 4.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      // Magnetic gate in center gap (opens while PULLING)
      { id: 'mg1', type: 'magnetic_gate', x: 0, z: -2.0, radius: 1.2, width: 7.2, depth: 0.9, mass: 10, hp: 1, maxHp: 1, active: true, gatePolarity: 'pull', gateOpen: false },
      // Pinball bumpers
      { id: 'bmp1', type: 'bumper', x: -4.8, z: 2.5, radius: 1.15, mass: 10, hp: 1, maxHp: 1, active: true },
      { id: 'bmp2', type: 'bumper', x: 4.8, z: 2.5, radius: 1.15, mass: 10, hp: 1, maxHp: 1, active: true },
      // Glass barriers protecting upper targets
      { id: 'gb1', type: 'glass_barrier', x: -6.5, z: -6.5, radius: 1.1, width: 4.5, depth: 0.8, mass: 10, hp: 2, maxHp: 2, active: true },
      { id: 'gb2', type: 'glass_barrier', x: 6.5, z: -6.5, radius: 1.1, width: 4.5, depth: 0.8, mass: 10, hp: 2, maxHp: 2, active: true },
      // 4 Targets
      { id: 't1', type: 'target_node', x: -8.5, z: 5.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't2', type: 'target_node', x: 8.5, z: 5.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't3', type: 'target_node', x: -6.5, z: -9.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't4', type: 'target_node', x: 6.5, z: -9.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      // Crystals
      { id: 'c1', type: 'crystal', x: 0, z: 2.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: -3.5, z: -8.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: 3.5, z: -8.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
  {
    id: 3,
    name: 'Kinetic Cascade',
    subtitle: 'Mode B · Chain Reaction Challenge (Par: 3 Pulses)',
    mode: 'chain',
    objectiveText: 'Shatter all 6 Targets using as few PUSH pulses as possible, then reach the Portal',
    parPulses: 3,
    arenaWidth: 28,
    arenaDepth: 28,
    playerSpawn: { x: 0, z: 8.5 },
    exitPortal: { x: 0, z: -11.0 },
    requiredTargets: 6,
    walls: [
      { x: -8.5, z: 0, width: 1.5, depth: 10, neonColor: 0xf59e0b },
      { x: 8.5, z: 0, width: 1.5, depth: 10, neonColor: 0xf59e0b },
    ],
    entities: [
      // Rich cluster of metal spheres for massive chain reaction
      { id: 'b1', type: 'metal_ball', x: -3.0, z: 4.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b2', type: 'metal_ball', x: -1.5, z: 4.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b3', type: 'metal_ball', x: 0, z: 3.8, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b4', type: 'metal_ball', x: 1.5, z: 4.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b5', type: 'metal_ball', x: 3.0, z: 4.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'b6', type: 'metal_cube', x: -2.2, z: 2.0, radius: 0.85, mass: 1.8, hp: 1, maxHp: 1, active: true },
      { id: 'b7', type: 'metal_cube', x: 2.2, z: 2.0, radius: 0.85, mass: 1.8, hp: 1, maxHp: 1, active: true },
      // Ring of Pinball Bumpers that ricochet balls into targets
      { id: 'bmp1', type: 'bumper', x: 0, z: -0.5, radius: 1.25, mass: 10, hp: 1, maxHp: 1, active: true },
      { id: 'bmp2', type: 'bumper', x: -4.5, z: -3.5, radius: 1.15, mass: 10, hp: 1, maxHp: 1, active: true },
      { id: 'bmp3', type: 'bumper', x: 4.5, z: -3.5, radius: 1.15, mass: 10, hp: 1, maxHp: 1, active: true },
      // 6 Targets arranged around the cascade chamber
      { id: 't1', type: 'target_node', x: -6.0, z: 1.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't2', type: 'target_node', x: 6.0, z: 1.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't3', type: 'target_node', x: -6.2, z: -6.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't4', type: 'target_node', x: 6.2, z: -6.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't5', type: 'target_node', x: -2.5, z: -7.8, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't6', type: 'target_node', x: 2.5, z: -7.8, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      // Crystals
      { id: 'c1', type: 'crystal', x: -5.0, z: 6.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: 5.0, z: 6.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: 0, z: -5.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
  {
    id: 4,
    name: 'Turbine Foundry',
    subtitle: 'Mode A · Arena Escape (Spinning Blade Hazards & Launchers)',
    mode: 'escape',
    objectiveText: 'Smash Spinning Blades with metal objects, destroy 4 Targets, and escape',
    arenaWidth: 30,
    arenaDepth: 30,
    playerSpawn: { x: 0, z: 11.5 },
    exitPortal: { x: 0, z: -12.0 },
    requiredTargets: 4,
    walls: [
      { x: 0, z: 3.5, width: 6.5, depth: 1.4, neonColor: 0x00f0ff },
      { x: -7.5, z: -4.0, width: 4.5, depth: 1.4, neonColor: 0x00f0ff },
      { x: 7.5, z: -4.0, width: 4.5, depth: 1.4, neonColor: 0x00f0ff },
    ],
    entities: [
      { id: 'mc1', type: 'metal_cube', x: -4.5, z: 8.0, radius: 0.85, mass: 2.2, hp: 1, maxHp: 1, active: true },
      { id: 'mc2', type: 'metal_cube', x: 4.5, z: 8.0, radius: 0.85, mass: 2.2, hp: 1, maxHp: 1, active: true },
      { id: 'mb1', type: 'metal_ball', x: -2.0, z: 7.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb2', type: 'metal_ball', x: 2.0, z: 7.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      // Launchers on side walls
      { id: 'l1', type: 'launcher', x: -12.0, z: 0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: Math.PI / 2, launcherInterval: 6.0, launcherTimer: 2.0 },
      { id: 'l2', type: 'launcher', x: 12.0, z: 0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: -Math.PI / 2, launcherInterval: 6.0, launcherTimer: 4.0 },
      // Spinning blade hazards patrolling the mid-zone (can be disabled by hitting them with metal objects!)
      { id: 'bl1', type: 'blade_hazard', x: -5.5, z: 0.5, radius: 1.25, mass: 4, hp: 1, maxHp: 1, active: true },
      { id: 'bl2', type: 'blade_hazard', x: 5.5, z: -1.5, radius: 1.25, mass: 4, hp: 1, maxHp: 1, active: true },
      // 4 Targets
      { id: 't1', type: 'target_node', x: -9.0, z: 5.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't2', type: 'target_node', x: 9.0, z: 5.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't3', type: 'target_node', x: -5.0, z: -8.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't4', type: 'target_node', x: 5.0, z: -8.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      // Crystals
      { id: 'c1', type: 'crystal', x: 0, z: 0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: -8.0, z: -8.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: 8.0, z: -8.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
  {
    id: 5,
    name: 'Overclock Reactor',
    subtitle: 'Mode C · Chaos Survival (Survive & Shatter 6 Targets)',
    mode: 'survival',
    objectiveText: 'Survive the hazard chamber, shatter 6 Overclock Nodes, and enter the Portal',
    survivalSeconds: 30,
    arenaWidth: 30,
    arenaDepth: 30,
    playerSpawn: { x: 0, z: 10.5 },
    exitPortal: { x: 0, z: -11.5 },
    requiredTargets: 6,
    walls: [
      { x: -6.0, z: 4.5, width: 3.5, depth: 1.4, neonColor: 0xff2a85 },
      { x: 6.0, z: 4.5, width: 3.5, depth: 1.4, neonColor: 0xff2a85 },
      { x: -6.0, z: -4.5, width: 3.5, depth: 1.4, neonColor: 0x10b981 },
      { x: 6.0, z: -4.5, width: 3.5, depth: 1.4, neonColor: 0x10b981 },
    ],
    entities: [
      { id: 'mb1', type: 'metal_ball', x: -3.5, z: 7.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb2', type: 'metal_ball', x: 0, z: 7.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb3', type: 'metal_ball', x: 3.5, z: 7.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mc1', type: 'metal_cube', x: -3.0, z: 1.5, radius: 0.85, mass: 2.0, hp: 1, maxHp: 1, active: true },
      { id: 'mc2', type: 'metal_cube', x: 3.0, z: 1.5, radius: 0.85, mass: 2.0, hp: 1, maxHp: 1, active: true },
      // Central bumper ring
      { id: 'bmp1', type: 'bumper', x: 0, z: 0, radius: 1.35, mass: 10, hp: 1, maxHp: 1, active: true },
      // Launchers feeding metal balls into the arena
      { id: 'l1', type: 'launcher', x: -12.5, z: 2.0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: Math.PI / 2, launcherInterval: 5.0, launcherTimer: 1.5 },
      { id: 'l2', type: 'launcher', x: 12.5, z: -2.0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: -Math.PI / 2, launcherInterval: 5.0, launcherTimer: 3.5 },
      // Blade hazards
      { id: 'bl1', type: 'blade_hazard', x: -8.5, z: 0, radius: 1.2, mass: 4, hp: 1, maxHp: 1, active: true },
      { id: 'bl2', type: 'blade_hazard', x: 8.5, z: 0, radius: 1.2, mass: 4, hp: 1, maxHp: 1, active: true },
      // 6 Targets
      { id: 't1', type: 'target_node', x: -10.0, z: 8.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't2', type: 'target_node', x: 10.0, z: 8.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't3', type: 'target_node', x: -10.0, z: -8.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't4', type: 'target_node', x: 10.0, z: -8.0, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't5', type: 'target_node', x: -4.0, z: -8.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      { id: 't6', type: 'target_node', x: 4.0, z: -8.5, radius: 0.95, mass: 5, hp: 1, maxHp: 1, active: true },
      // Crystals
      { id: 'c1', type: 'crystal', x: -4.5, z: 4.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: 4.5, z: 4.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: 0, z: -6.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
  {
    id: 6,
    name: 'Goliath Magnetron',
    subtitle: 'Mode D · Boss Machine Showdown',
    mode: 'boss',
    objectiveText: 'Pull projectiles from the Boss Launchers and PUSH them into all 3 Exposed Boss Cores!',
    arenaWidth: 32,
    arenaDepth: 32,
    playerSpawn: { x: 0, z: 11.5 },
    exitPortal: { x: 0, z: -13.0 },
    requiredTargets: 3,
    walls: [
      { x: -8.5, z: 5.5, width: 4.0, depth: 1.4, neonColor: 0xff7a00 },
      { x: 8.5, z: 5.5, width: 4.0, depth: 1.4, neonColor: 0xff7a00 },
    ],
    entities: [
      // Starter metal balls & heavy cubes
      { id: 'mb1', type: 'metal_ball', x: -4.0, z: 8.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb2', type: 'metal_ball', x: 0, z: 7.5, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mb3', type: 'metal_ball', x: 4.0, z: 8.0, radius: 0.68, mass: 1.0, hp: 1, maxHp: 1, active: true },
      { id: 'mc1', type: 'metal_cube', x: -5.5, z: 3.0, radius: 0.85, mass: 2.2, hp: 1, maxHp: 1, active: true },
      { id: 'mc2', type: 'metal_cube', x: 5.5, z: 3.0, radius: 0.85, mass: 2.2, hp: 1, maxHp: 1, active: true },
      // Glass shield in front of central boss core
      { id: 'gb1', type: 'glass_barrier', x: 0, z: 1.8, radius: 1.2, width: 7.5, depth: 0.9, mass: 10, hp: 2, maxHp: 2, active: true },
      // 3 Exposed Boss Machine Cores (Left Wing, Center Reactor, Right Wing)
      { id: 'boss_c1', type: 'boss_core', x: -6.2, z: -2.5, radius: 1.35, mass: 12, hp: 2, maxHp: 2, active: true },
      { id: 'boss_c2', type: 'boss_core', x: 0, z: -3.5, radius: 1.55, mass: 15, hp: 3, maxHp: 3, active: true },
      { id: 'boss_c3', type: 'boss_core', x: 6.2, z: -2.5, radius: 1.35, mass: 12, hp: 2, maxHp: 2, active: true },
      // Boss Launchers firing metal spheres
      { id: 'bl_l1', type: 'launcher', x: -10.5, z: -6.0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: Math.PI * 0.25, launcherInterval: 4.8, launcherTimer: 1.2 },
      { id: 'bl_l2', type: 'launcher', x: 10.5, z: -6.0, radius: 1.1, mass: 10, hp: 1, maxHp: 1, active: true, rotationY: -Math.PI * 0.25, launcherInterval: 4.8, launcherTimer: 2.8 },
      // Bumpers flanking boss
      { id: 'bmp1', type: 'bumper', x: -9.5, z: 0.5, radius: 1.2, mass: 10, hp: 1, maxHp: 1, active: true },
      { id: 'bmp2', type: 'bumper', x: 9.5, z: 0.5, radius: 1.2, mass: 10, hp: 1, maxHp: 1, active: true },
      // Crystals
      { id: 'c1', type: 'crystal', x: -8.0, z: 9.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c2', type: 'crystal', x: 8.0, z: 9.0, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c3', type: 'crystal', x: -4.0, z: -8.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
      { id: 'c4', type: 'crystal', x: 4.0, z: -8.5, radius: 0.65, mass: 1, hp: 1, maxHp: 1, active: true },
    ],
  },
];
