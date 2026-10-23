export type GameState = 'title' | 'playing' | 'paused' | 'gameover';

export type GameMode = 'escape' | 'chain' | 'survival' | 'boss';

export type MagnetPolarity = 'idle' | 'pull' | 'push';

export type ArenaObjectType =
  | 'metal_ball'
  | 'metal_cube'
  | 'crystal'
  | 'glass_barrier'
  | 'magnetic_gate'
  | 'bumper'
  | 'blade_hazard'
  | 'launcher'
  | 'target_node'
  | 'boss_core';

export interface Vec2 {
  x: number;
  z: number;
}

export interface ArenaEntity {
  id: string;
  type: ArenaObjectType;
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  mass: number;
  hp: number;
  maxHp: number;
  active: boolean;
  hitFlash: number;
  chargeLevel: number;
  // Type-specific properties
  width?: number;
  depth?: number;
  rotationY?: number;
  gatePolarity?: 'pull' | 'push';
  gateOpen?: boolean;
  launcherTimer?: number;
  launcherInterval?: number;
  lastHitTime?: number;
  hitCount?: number;
}

export interface WallSegment {
  x: number;
  z: number;
  width: number;
  depth: number;
  neonColor?: number;
}

export interface ArenaLevelConfig {
  id: number;
  name: string;
  subtitle: string;
  mode: GameMode;
  objectiveText: string;
  tutorialHints?: string[];
  arenaWidth: number;
  arenaDepth: number;
  playerSpawn: Vec2;
  exitPortal: Vec2;
  parPulses?: number;
  survivalSeconds?: number;
  requiredTargets: number;
  walls: WallSegment[];
  entities: Omit<ArenaEntity, 'vx' | 'vz' | 'hitFlash' | 'chargeLevel'>[];
}

export interface PlayerState {
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  hp: number;
  maxHp: number;
  invulnerableTimer: number;
  polarity: MagnetPolarity;
  pushCooldown: number;
  pushWaveTimer: number;
  energy: number;
  maxEnergy: number;
  aimDirX: number;
  aimDirZ: number;
}

export interface UpgradeLevels {
  magnetRange: number; // 1 to 5
  pulseForce: number;  // 1 to 5
  coreShield: number;  // 1 to 5
}

export interface OrbSkin {
  id: string;
  name: string;
  roleDesc: string;
  primaryHex: number;
  secondaryHex: number;
  coreHex: number;
  cssColor: string;
  cost: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  volume: number;
  quality: 'high' | 'balanced';
  reducedMotion: boolean;
  controlScheme: 'hold_space' | 'dual_touch';
}

export interface RunSnapshot {
  victory: boolean;
  arenaId: number;
  arenaName: string;
  mode: GameMode;
  score: number;
  bestScore: number;
  maxCombo: number;
  pulsesUsed: number;
  clearTimeSec: number;
  targetsCleared: number;
  targetsTotal: number;
  crystalsEarned: number;
  damageTaken: number;
  reason: string;
}

export interface SaveData {
  crystals: number;
  highestUnlockedArena: number;
  bestScores: Record<number, number>;
  unlockedSkins: string[];
  selectedSkin: string;
  upgrades: UpgradeLevels;
  settings: GameSettings;
}
