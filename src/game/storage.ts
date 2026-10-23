import { SaveData } from './types';

const STORAGE_KEY = 'magnet_mayhem_save_v1';

export const DEFAULT_SAVE_DATA: SaveData = {
  crystals: 6,
  highestUnlockedArena: 1,
  bestScores: {},
  unlockedSkins: ['neon_cyan'],
  selectedSkin: 'neon_cyan',
  upgrades: {
    magnetRange: 1,
    pulseForce: 1,
    coreShield: 1,
  },
  settings: {
    soundEnabled: true,
    volume: 0.75,
    quality: 'high',
    reducedMotion: false,
    controlScheme: 'hold_space',
  },
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SAVE_DATA);
    const parsed = JSON.parse(raw);
    return {
      crystals: typeof parsed.crystals === 'number' ? Math.max(0, parsed.crystals) : DEFAULT_SAVE_DATA.crystals,
      highestUnlockedArena:
        typeof parsed.highestUnlockedArena === 'number'
          ? Math.max(1, Math.min(6, parsed.highestUnlockedArena))
          : 1,
      bestScores: parsed.bestScores && typeof parsed.bestScores === 'object' ? parsed.bestScores : {},
      unlockedSkins: Array.isArray(parsed.unlockedSkins) && parsed.unlockedSkins.length > 0
        ? parsed.unlockedSkins
        : ['neon_cyan'],
      selectedSkin: typeof parsed.selectedSkin === 'string' ? parsed.selectedSkin : 'neon_cyan',
      upgrades: {
        magnetRange: Math.max(1, Math.min(5, parsed.upgrades?.magnetRange ?? 1)),
        pulseForce: Math.max(1, Math.min(5, parsed.upgrades?.pulseForce ?? 1)),
        coreShield: Math.max(1, Math.min(5, parsed.upgrades?.coreShield ?? 1)),
      },
      settings: {
        soundEnabled:
          typeof parsed.settings?.soundEnabled === 'boolean'
            ? parsed.settings.soundEnabled
            : DEFAULT_SAVE_DATA.settings.soundEnabled,
        volume:
          typeof parsed.settings?.volume === 'number'
            ? Math.max(0, Math.min(1, parsed.settings.volume))
            : DEFAULT_SAVE_DATA.settings.volume,
        quality: parsed.settings?.quality === 'balanced' ? 'balanced' : 'high',
        reducedMotion: Boolean(parsed.settings?.reducedMotion),
        controlScheme: parsed.settings?.controlScheme === 'dual_touch' ? 'dual_touch' : 'hold_space',
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE_DATA);
  }
}

export function saveGameData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted frames
  }
}
