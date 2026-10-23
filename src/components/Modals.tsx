import React from 'react';
import { ARENA_LEVELS, ORB_SKINS } from '../game/levels';
import { GameSettings, RunSnapshot, SaveData, UpgradeLevels } from '../game/types';

interface PauseModalProps {
  arenaName: string;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onQuitToTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  arenaName,
  onResume,
  onRestart,
  onOpenSettings,
  onQuitToTitle,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05070F]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="w-full max-w-md bg-[#091024] border-2 border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
        <div className="text-xs font-display font-bold uppercase tracking-wider text-cyan-400 mb-1">
          Simulation Halted
        </div>
        <h2 id="pause-modal-title" className="text-2xl font-display font-extrabold text-white mb-1">
          Game Paused
        </h2>
        <p className="text-xs text-slate-400 mb-6">Active Chamber: {arenaName}</p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-extrabold text-base uppercase tracking-wide cursor-pointer transition-transform active:scale-98"
          >
            Resume Chamber (Esc / P)
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-5 rounded-xl bg-[#111C38] hover:bg-[#19284D] border border-slate-600 text-white font-display font-bold text-sm uppercase tracking-wide cursor-pointer"
          >
            Restart Arena (R)
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-3 px-5 rounded-xl bg-[#111C38] hover:bg-[#19284D] border border-slate-700 text-slate-200 font-display font-bold text-sm uppercase tracking-wide cursor-pointer"
          >
            Settings &amp; Controls
          </button>
          <button
            type="button"
            onClick={onQuitToTitle}
            className="w-full py-3 px-5 rounded-xl bg-[#1A1025] hover:bg-[#29173B] border border-rose-500/40 text-rose-300 font-display font-bold text-sm uppercase tracking-wide cursor-pointer"
          >
            Return to Title Screen
          </button>
        </div>
      </div>
    </div>
  );
};

interface OutcomeModalProps {
  snapshot: RunSnapshot;
  onPlayAgain: () => void;
  onNextArena: () => void;
  onQuitToTitle: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  snapshot,
  onPlayAgain,
  onNextArena,
  onQuitToTitle,
}) => {
  const hasNextArena = snapshot.arenaId < ARENA_LEVELS.length;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05070F]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="outcome-modal-title"
    >
      <div
        className={`w-full max-w-lg bg-[#091024] border-2 rounded-2xl p-6 sm:p-7 shadow-2xl ${
          snapshot.victory ? 'border-emerald-400/60' : 'border-rose-500/60'
        }`}
      >
        <div
          className={`text-xs font-display font-bold uppercase tracking-wider mb-1 ${
            snapshot.victory ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {snapshot.victory ? `Arena 0${snapshot.arenaId} Cleared!` : 'Magnetic Containment Lost'}
        </div>
        <h2 id="outcome-modal-title" className="text-3xl font-display font-extrabold text-white mb-1">
          {snapshot.victory ? 'Victory — Chain Complete' : 'Core Shattered'}
        </h2>
        <p className="text-sm text-slate-300 mb-5">{snapshot.reason}</p>

        {/* 3 Tabular Stat Tiles */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-slate-400">
              FINAL SCORE
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-white tabular-nums mt-0.5">
              {Math.round(snapshot.score)}
            </div>
            <div className="text-[11px] font-mono-tabular text-cyan-400 mt-0.5">
              Best: {Math.round(snapshot.bestScore)}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-slate-400">
              {snapshot.victory ? 'CLEAR TIME' : 'TARGETS HIT'}
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-amber-400 tabular-nums mt-0.5">
              {snapshot.victory
                ? `${Math.round(snapshot.clearTimeSec)}s`
                : `${snapshot.targetsCleared}/${snapshot.targetsTotal}`}
            </div>
            <div className="text-[11px] font-mono-tabular text-slate-400 mt-0.5">
              Max Combo: {Math.round(snapshot.maxCombo)}x
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-3">
            <div className="text-[10px] font-display uppercase tracking-wider text-slate-400">
              PULSES &amp; REWARD
            </div>
            <div className="text-xl sm:text-2xl font-display font-extrabold text-emerald-400 tabular-nums mt-0.5">
              +{Math.round(snapshot.crystalsEarned)} Gems
            </div>
            <div className="text-[11px] font-mono-tabular text-slate-400 mt-0.5">
              Pulses: {Math.round(snapshot.pulsesUsed)}
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          {snapshot.victory && hasNextArena ? (
            <button
              type="button"
              data-start="true"
              onClick={onNextArena}
              className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-extrabold text-base uppercase tracking-wide cursor-pointer"
            >
              Next Arena (Enter)
            </button>
          ) : null}

          <button
            type="button"
            data-start={!snapshot.victory || !hasNextArena ? 'true' : undefined}
            onClick={onPlayAgain}
            className={`flex-1 py-3.5 px-5 rounded-xl font-display font-extrabold text-base uppercase tracking-wide cursor-pointer ${
              !snapshot.victory || !hasNextArena
                ? 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                : 'bg-[#132042] hover:bg-[#1B2C59] text-white border border-slate-600'
            }`}
          >
            Play Again
          </button>

          <button
            type="button"
            onClick={onQuitToTitle}
            className="py-3.5 px-5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] border border-slate-700 text-slate-300 font-display font-bold text-sm uppercase tracking-wide cursor-pointer"
          >
            Title Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface GarageModalProps {
  saveData: SaveData;
  onSelectSkin: (skinId: string) => void;
  onUnlockSkin: (skinId: string, cost: number) => void;
  onUpgradeStat: (stat: keyof UpgradeLevels, cost: number) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({
  saveData,
  onSelectSkin,
  onUnlockSkin,
  onUpgradeStat,
  onClose,
}) => {
  const upgradeItems: Array<{
    key: keyof UpgradeLevels;
    title: string;
    desc: string;
    level: number;
  }> = [
    {
      key: 'magnetRange',
      title: 'Magnetic Field Radius',
      desc: 'Expands attractive Pull and repulsive Push field diameter (+1.1m per tier)',
      level: saveData.upgrades.magnetRange,
    },
    {
      key: 'pulseForce',
      title: 'Coil Impulse Output',
      desc: 'Increases Pull acceleration and Push shockwave launch velocity',
      level: saveData.upgrades.pulseForce,
    },
    {
      key: 'coreShield',
      title: 'Core Integrity Plating',
      desc: 'Adds +1 maximum Core Shield Pip at level 3 and level 5',
      level: saveData.upgrades.coreShield,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05070F]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="garage-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#091024] border-2 border-cyan-500/40 rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <div className="text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
              Laboratory Armory
            </div>
            <h2 id="garage-modal-title" className="text-2xl font-display font-extrabold text-white">
              Orb Skins &amp; Magnetic Upgrades
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0F172A] border border-emerald-500/40 rounded-xl px-3.5 py-1.5 text-sm font-mono-tabular font-bold text-emerald-400">
              {Math.round(saveData.crystals)} Crystals
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Section 1: Cosmetic Orb Skins */}
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-300 mb-3">
          01. Magnetic Core Shells
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {ORB_SKINS.map((skin) => {
            const isUnlocked = saveData.unlockedSkins.includes(skin.id);
            const isSelected = saveData.selectedSkin === skin.id;
            const canAfford = saveData.crystals >= skin.cost;

            return (
              <div
                key={skin.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400'
                    : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full border-2 border-white shrink-0"
                    style={{
                      backgroundColor: skin.cssColor,
                      boxShadow: `0 0 14px ${skin.cssColor}`,
                    }}
                  />
                  <div>
                    <div className="text-sm font-display font-bold text-white">{skin.name}</div>
                    <div className="text-xs text-slate-400">{skin.roleDesc}</div>
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    type="button"
                    onClick={() => onSelectSkin(skin.id)}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Equipped' : 'Equip'}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onUnlockSkin(skin.id, skin.cost)}
                    className={`px-3 py-1.5 rounded-lg font-display font-bold text-xs whitespace-nowrap ${
                      canAfford
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Unlock · {skin.cost} Gems
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Section 2: Permanent Magnetic Coil Upgrades */}
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-300 mb-3">
          02. Permanent Coil Calibration
        </h3>
        <div className="flex flex-col gap-3">
          {upgradeItems.map((item) => {
            const isMax = item.level >= 5;
            const cost = item.level * 3;
            const canAfford = saveData.crystals >= cost && !isMax;

            return (
              <div
                key={item.key}
                className="p-3.5 rounded-xl bg-[#0F172A] border border-slate-800 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-sm font-display font-bold text-white">
                    {item.title} · <span className="text-cyan-400 font-mono-tabular">Tier {item.level}/5</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                </div>

                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => onUpgradeStat(item.key, cost)}
                  className={`px-3.5 py-2 rounded-lg font-display font-bold text-xs whitespace-nowrap ${
                    isMax
                      ? 'bg-slate-800 text-emerald-400 cursor-default'
                      : canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isMax ? 'MAXED' : `Upgrade · ${cost} Gems`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (partial: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#05070F]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-md bg-[#091024] border-2 border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
              System Configuration
            </div>
            <h2 id="settings-modal-title" className="text-2xl font-display font-extrabold text-white">
              Settings &amp; Controls
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-display font-bold text-sm cursor-pointer"
          >
            Done
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Audio Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-white">Procedural Synth Audio</div>
              <div className="text-xs text-slate-400">Magnetic hum, Push bass, and collision clanks</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3.5 py-1.5 rounded-lg font-display font-bold text-xs cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="p-3 rounded-xl bg-[#0F172A] border border-slate-800">
            <label htmlFor="volume-range" className="flex justify-between text-xs font-semibold text-slate-300 mb-2">
              <span>Master Synth Volume</span>
              <span className="font-mono-tabular">{Math.round(settings.volume * 100)}%</span>
            </label>
            <input
              id="volume-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(e) => onUpdateSettings({ volume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Graphics Quality */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-white">Graphics Quality</div>
              <div className="text-xs text-slate-400">Adjust shadow and particle density for mobile</div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  quality: settings.quality === 'high' ? 'balanced' : 'high',
                })
              }
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-display font-bold text-xs uppercase cursor-pointer"
            >
              {settings.quality}
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-slate-800">
            <div>
              <div className="text-sm font-semibold text-white">Reduced Camera Shake</div>
              <div className="text-xs text-slate-400">Dampens impact shake and FOV recoil</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
              className={`px-3.5 py-1.5 rounded-lg font-display font-bold text-xs cursor-pointer ${
                settings.reducedMotion
                  ? 'bg-emerald-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.reducedMotion ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
