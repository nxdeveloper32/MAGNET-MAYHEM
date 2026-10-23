import React from 'react';
import { ARENA_LEVELS, ORB_SKINS } from '../game/levels';
import { SaveData } from '../game/types';

interface TitleScreenProps {
  saveData: SaveData;
  selectedArenaId: number;
  onSelectArena: (id: number) => void;
  onStartGame: () => void;
  onOpenGarage: () => void;
  onOpenSettings: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  saveData,
  selectedArenaId,
  onSelectArena,
  onStartGame,
  onOpenGarage,
  onOpenSettings,
}) => {
  const currentArena = ARENA_LEVELS.find((a) => a.id === selectedArenaId) ?? ARENA_LEVELS[0];
  const activeSkin = ORB_SKINS.find((s) => s.id === saveData.selectedSkin) ?? ORB_SKINS[0];
  const bestForArena = saveData.bestScores[currentArena.id] ?? 0;

  return (
    <div
      className="fixed inset-0 z-20 flex flex-col justify-between p-5 sm:p-8 lg:p-10 pointer-events-none"
      style={{
        background:
          'radial-gradient(circle at 72% 45%, rgba(5, 7, 15, 0.08) 0%, rgba(5, 7, 15, 0.72) 58%, rgba(5, 7, 15, 0.94) 100%)',
      }}
    >
      {/* Top Bar: World-Matched Status & Utility Actions */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="flex items-center gap-4 bg-[#090E1E]/95 border border-cyan-500/30 rounded-xl px-4 py-2.5 shadow-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" aria-hidden="true">
            <polygon points="12,2 20,9 16,21 8,21 4,9" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" />
            <polygon points="12,5 17,10 12,18 7,10" fill="#34D399" />
          </svg>
          <div>
            <div className="text-[10px] font-display tracking-wider uppercase text-slate-400">Energy Crystals</div>
            <div className="text-lg font-display font-bold text-emerald-400 tabular-nums leading-tight">
              {Math.round(saveData.crystals)}
            </div>
          </div>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <div>
            <div className="text-[10px] font-display tracking-wider uppercase text-slate-400">Active Core</div>
            <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSkin.cssColor }}
              />
              <span>{activeSkin.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenGarage}
            className="px-4 py-2.5 rounded-xl bg-[#0B132B]/95 hover:bg-[#152247] border border-cyan-400/35 text-cyan-300 font-display font-bold text-sm tracking-wide transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Garage &amp; Upgrades
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="px-4 py-2.5 rounded-xl bg-[#0B132B]/95 hover:bg-[#152247] border border-slate-600/50 text-slate-200 font-display font-bold text-sm tracking-wide transition-transform active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Settings
          </button>
        </div>
      </div>

      {/* Left-Third Negative Space Focal Lockup + Arena Selector */}
      <div className="max-w-xl my-auto pointer-events-auto flex flex-col gap-5">
        {/* Custom Inline SVG Title Lockup */}
        <div className="select-none">
          <svg
            viewBox="0 0 560 155"
            className="w-full max-w-[500px] h-auto drop-shadow-[0_6px_24px_rgba(0,240,255,0.28)]"
            role="img"
            aria-label="Magnet Mayhem: Pull. Push. Survive."
          >
            <defs>
              <linearGradient id="mmCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00F0FF" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
              <linearGradient id="mmOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF7A00" />
                <stop offset="100%" stopColor="#FF2A85" />
              </linearGradient>
            </defs>

            {/* Decorative Magnetic Field Arcs */}
            <path
              d="M 18 76 C 2 42, 2 18, 34 10"
              fill="none"
              stroke="#00F0FF"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d="M 542 76 C 558 42, 558 18, 526 10"
              fill="none"
              stroke="#FF7A00"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.8"
            />

            {/* Main Emblem Backing Plate */}
            <polygon
              points="28,12 532,12 548,108 12,108"
              fill="#070C1B"
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            <line x1="28" y1="12" x2="275" y2="12" stroke="#00F0FF" strokeWidth="4" />
            <line x1="285" y1="12" x2="532" y2="12" stroke="#FF7A00" strokeWidth="4" />

            {/* MAGNET MAYHEM Display Typography */}
            <text
              x="36"
              y="64"
              fill="url(#mmCyanGrad)"
              fontFamily="Oxanium, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="3"
            >
              MAGNET
            </text>
            <text
              x="266"
              y="64"
              fill="url(#mmOrangeGrad)"
              fontFamily="Oxanium, sans-serif"
              fontWeight="800"
              fontSize="48"
              letterSpacing="3"
            >
              MAYHEM
            </text>

            {/* Subtitle Strip inside SVG */}
            <text
              x="38"
              y="94"
              fill="#E2E8F0"
              fontFamily="Oxanium, sans-serif"
              fontWeight="700"
              fontSize="16"
              letterSpacing="6.5"
            >
              PULL · PUSH · SURVIVE
            </text>

            {/* Bottom Polarity Bar */}
            <rect x="12" y="120" width="258" height="24" rx="4" fill="#082F49" stroke="#00F0FF" strokeWidth="1.5" />
            <text
              x="141"
              y="136"
              textAnchor="middle"
              fill="#38BDF8"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="11"
              letterSpacing="2"
            >
              ◄ ATTRACTIVE FIELD (PULL)
            </text>

            <rect x="290" y="120" width="258" height="24" rx="4" fill="#431407" stroke="#FF7A00" strokeWidth="1.5" />
            <text
              x="419"
              y="136"
              textAnchor="middle"
              fill="#FB923C"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
              fontSize="11"
              letterSpacing="2"
            >
              REPULSIVE IMPULSE (PUSH) ►
            </text>
          </svg>
        </div>

        {/* Selected Arena Briefing Panel */}
        <div className="bg-[#090F22]/95 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-cyan-400">
              Arena 0{currentArena.id} · {currentArena.subtitle}
            </span>
            <span className="text-xs font-mono-tabular text-amber-400">
              Best: {Math.round(bestForArena)} pts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight mb-1.5">
            {currentArena.name}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {currentArena.objectiveText}
          </p>

          {/* 6-Arena Selector Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4" role="group" aria-label="Select Arena Stage">
            {ARENA_LEVELS.map((arena) => {
              const unlocked = arena.id <= saveData.highestUnlockedArena;
              const isSelected = arena.id === selectedArenaId;
              return (
                <button
                  key={arena.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => onSelectArena(arena.id)}
                  aria-label={`Arena ${arena.id}: ${arena.name}${unlocked ? '' : ' (Locked)'}`}
                  className={`py-2 px-2 rounded-lg font-display font-bold text-xs transition-all flex flex-col items-center justify-center border ${
                    isSelected
                      ? 'bg-cyan-500/25 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.35)] cursor-pointer'
                      : unlocked
                        ? 'bg-[#0F172A] border-slate-700 text-slate-300 hover:border-slate-500 cursor-pointer'
                        : 'bg-[#070A14] border-slate-800/70 text-slate-600 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>0{arena.id}</span>
                  <span className="text-[10px] font-sans font-normal truncate max-w-full">
                    {unlocked ? arena.mode.toUpperCase() : 'LOCKED'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Primary PLAY CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              data-start="true"
              onClick={onStartGame}
              className="flex-1 py-3.5 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-extrabold text-lg tracking-wider uppercase shadow-[0_0_24px_rgba(0,240,255,0.45)] transition-transform active:scale-98 cursor-pointer flex items-center justify-center gap-3"
            >
              <span>Launch Arena 0{currentArena.id}</span>
              <span className="text-xs font-mono-tabular px-2 py-0.5 rounded bg-slate-950/20 text-slate-950">
                ENTER / SPACE
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Safe Margin: Flat Single-Line Control Hint */}
      <div className="text-center sm:text-left text-xs sm:text-sm text-slate-300 font-medium tracking-wide pointer-events-none">
        WASD / Arrows Move · Hold Left-Click or Q to Pull · Space / Right-Click or E to Push · Esc Pause
      </div>
    </div>
  );
};
