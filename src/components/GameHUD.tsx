import React from 'react';
import { ArenaLevelConfig, MagnetPolarity } from '../game/types';

interface GameHUDProps {
  arena: ArenaLevelConfig;
  hp: number;
  maxHp: number;
  score: number;
  combo: number;
  crystals: number;
  targetsCleared: number;
  targetsTotal: number;
  pulsesUsed: number;
  elapsedSec: number;
  polarity: MagnetPolarity;
  clusterCount: number;
  soundEnabled: boolean;
  tutorialStep: number;
  onToggleSound: () => void;
  onPause: () => void;
  onRestart: () => void;
  onHoldPullStart: () => void;
  onHoldPullEnd: () => void;
  onTriggerPush: () => void;
  onTouchMoveVector: (dx: number, dz: number) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  arena,
  hp,
  maxHp,
  score,
  combo,
  crystals,
  targetsCleared,
  targetsTotal,
  pulsesUsed,
  elapsedSec,
  polarity,
  clusterCount,
  soundEnabled,
  tutorialStep,
  onToggleSound,
  onPause,
  onRestart,
  onHoldPullStart,
  onHoldPullEnd,
  onTriggerPush,
  onTouchMoveVector,
}) => {
  const exitUnlocked = targetsCleared >= targetsTotal;

  // Touch Virtual Joystick tracking for mobile / Android
  const stickRef = React.useRef<HTMLDivElement | null>(null);
  const [knobOffset, setKnobOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleStickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    updateStick(e.clientX, e.clientY);
  };

  const handleStickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    updateStick(e.clientX, e.clientY);
  };

  const handleStickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setKnobOffset({ x: 0, y: 0 });
    onTouchMoveVector(0, 0);
  };

  const updateStick = (clientX: number, clientY: number) => {
    if (!stickRef.current) return;
    const rect = stickRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const maxR = rect.width * 0.42;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const nx = dist > 0.01 ? dx / dist : 0;
    const ny = dist > 0.01 ? dy / dist : 0;
    setKnobOffset({ x: nx * clamped, y: ny * clamped });
    onTouchMoveVector(nx * (clamped / maxR), ny * (clamped / maxR));
  };

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Low-HP Peripheral Danger Vignette */}
      {hp === 1 && (
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 70px rgba(255, 42, 133, 0.45)',
          }}
        />
      )}

      {/* TOP PERIMETER BAR: 3 Compact Corner Clusters */}
      <div className="flex items-start justify-between gap-1.5 sm:gap-3">
        {/* Top-Left Cluster: Core Shield Vitality Pips & Objective Status */}
        <div className="bg-[#080D1E]/90 border border-slate-700/80 rounded-xl px-2.5 py-2 sm:px-3.5 sm:py-2.5 shadow-lg flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
              SHIELD
            </span>
            <div className="flex items-center gap-1" aria-label={`Core Integrity: ${hp} of ${maxHp}`}>
              {Array.from({ length: maxHp }).map((_, idx) => {
                const isFull = idx < hp;
                const isCracked = idx === hp && hp < maxHp;
                return (
                  <svg key={idx} viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true">
                    <polygon
                      points="12,2 21,7 21,17 12,22 3,17 3,7"
                      fill="#05070F"
                      stroke={isFull ? '#00F0FF' : isCracked ? '#FF2A85' : '#334155'}
                      strokeWidth="2"
                    />
                    {isFull && (
                      <>
                        <polygon points="12,5 18,8.5 18,15.5 12,19 6,15.5 6,8.5" fill="#00F0FF" />
                        <polygon points="12,5 18,8.5 12,12 6,8.5" fill="#E0F2FE" />
                      </>
                    )}
                    {isCracked && (
                      <path
                        d="M8,7 L13,12 L10,16 L15,19"
                        fill="none"
                        stroke="#FF2A85"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    )}
                  </svg>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs whitespace-nowrap">
            <span className="font-display font-bold text-cyan-300 hidden sm:inline">
              0{arena.id} · {arena.name}
            </span>
            <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
            <span
              className={`font-mono-tabular font-bold ${
                exitUnlocked ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {exitUnlocked
                ? 'PORTAL OPEN!'
                : `TARGETS: ${Math.round(targetsCleared)}/${Math.round(targetsTotal)}`}
            </span>
          </div>
        </div>

        {/* Top-Center Cluster: Score, Combo Multiplier & Telemetry */}
        <div className="bg-[#080D1E]/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-lg flex items-center gap-2.5 sm:gap-5">
          <div>
            <div className="text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
              SCORE
            </div>
            <div
              className="text-lg sm:text-3xl font-display font-extrabold text-white tabular-nums leading-none hud-stroke"
              data-testid="hud-score"
            >
              {Math.round(score)}
            </div>
          </div>

          <div>
            <div className="text-[9px] sm:text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
              COMBO
            </div>
            <div
              className={`text-base sm:text-2xl font-display font-extrabold tabular-nums leading-none ${
                combo > 1 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {Math.round(combo)}x
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
              PULSES
            </div>
            <div className="text-lg font-mono-tabular font-bold text-slate-200 leading-none">
              {Math.round(pulsesUsed)}
              {arena.parPulses ? ` / ${arena.parPulses}` : ''}
            </div>
          </div>

          <div className="hidden md:block">
            <div className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-400">
              TIME
            </div>
            <div className="text-lg font-mono-tabular font-bold text-slate-200 leading-none">
              {Math.round(elapsedSec)}s
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <polygon points="12,2 20,9 16,21 8,21 4,9" fill="#064E3B" stroke="#10B981" strokeWidth="1.8" />
              <polygon points="12,5 17,10 12,18 7,10" fill="#34D399" />
            </svg>
            <span className="text-base font-mono-tabular font-bold text-emerald-400">
              {Math.round(crystals)}
            </span>
          </div>
        </div>

        {/* Top-Right Cluster: Compact Square SVG Utility Buttons (Mute [M], Restart [R], Pause [P]) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            type="button"
            tabIndex={-1}
            aria-label={soundEnabled ? 'Mute Audio (M)' : 'Unmute Audio (M)'}
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleSound();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080D1E]/90 hover:bg-[#162244] border border-slate-700/80 flex items-center justify-center text-slate-200 transition-transform active:scale-95 cursor-pointer"
          >
            {soundEnabled ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#00F0FF" fillOpacity="0.2" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="#FF2A85" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Restart Arena (R)"
            onClick={(e) => {
              e.currentTarget.blur();
              onRestart();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080D1E]/90 hover:bg-[#162244] border border-slate-700/80 flex items-center justify-center text-slate-200 transition-transform active:scale-95 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            aria-label="Pause Game (P or Escape)"
            onClick={(e) => {
              e.currentTarget.blur();
              onPause();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080D1E]/90 hover:bg-[#162244] border border-slate-700/80 flex items-center justify-center text-slate-200 transition-transform active:scale-95 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Interactive 5-Second Tutorial Callout on Arena 1 */}
      {arena.id === 1 && arena.tutorialHints && (
        <div className="mx-auto mt-2 max-w-xl bg-[#09122A]/95 border border-cyan-400/50 rounded-xl px-3.5 py-1.5 text-center shadow-lg">
          <p className="text-xs sm:text-sm font-semibold text-cyan-200">
            {exitUnlocked
              ? arena.tutorialHints[2]
              : tutorialStep === 0
                ? arena.tutorialHints[0]
                : arena.tutorialHints[1]}
          </p>
        </div>
      )}

      {/* BOTTOM PERIMETER DOCK: Touch Joystick + Dual Magnetic Controls (<= 15% Viewport Height) */}
      <div className="flex items-end justify-between gap-2 sm:gap-3 mt-auto">
        {/* Left Mobile/Touch Virtual Joystick */}
        <div
          ref={stickRef}
          onPointerDown={handleStickPointerDown}
          onPointerMove={handleStickPointerMove}
          onPointerUp={handleStickPointerUp}
          onPointerCancel={handleStickPointerUp}
          aria-label="Touch Movement Stick"
          className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#080D1E]/85 border-2 border-slate-600/70 flex items-center justify-center relative pointer-events-auto touch-none cursor-grab active:cursor-grabbing shrink-0"
        >
          <div className="text-[8px] sm:text-[9px] font-display uppercase tracking-widest text-slate-400 absolute top-1.5 sm:top-2">
            MOVE
          </div>
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cyan-400/90 border-2 border-white shadow-[0_0_12px_rgba(0,240,255,0.6)] pointer-events-none"
            style={{
              transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
            }}
          />
        </div>

        {/* Center/Right Dual Magnetic Action Dock (HOLD PULL & TAP PUSH) */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* HOLD LEFT: MAGNETIC PULL */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Hold for Magnetic Pull"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onHoldPullStart();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              onHoldPullEnd();
            }}
            onPointerLeave={onHoldPullEnd}
            onPointerCancel={onHoldPullEnd}
            className={`px-3.5 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 font-display font-extrabold transition-transform active:scale-95 cursor-pointer flex items-center gap-2 sm:gap-3 whitespace-nowrap ${
              polarity === 'pull'
                ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_25px_rgba(0,240,255,0.75)]'
                : 'bg-[#07182C]/95 text-cyan-300 border-cyan-400/60 hover:border-cyan-300'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="12" cy="12" r="4" fill="currentColor" />
              <path d="M4 12h4M16 12h4M12 4v4M12 16v4" />
            </svg>
            <div className="text-left">
              <div className="text-xs sm:text-base leading-none">PULL ({Math.round(clusterCount)})</div>
              <div className="text-[10px] font-mono-tabular opacity-80 mt-0.5 hidden sm:block">
                HOLD CLICK / Q
              </div>
            </div>
          </button>

          {/* TAP RIGHT: MAGNETIC PUSH PULSE */}
          <button
            type="button"
            tabIndex={-1}
            aria-label="Trigger Magnetic Push Impulse"
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.blur();
              onTriggerPush();
            }}
            className={`px-3.5 py-3 sm:px-6 sm:py-4 rounded-2xl border-2 font-display font-extrabold transition-transform active:scale-95 cursor-pointer flex items-center gap-2 sm:gap-3 whitespace-nowrap ${
              polarity === 'push'
                ? 'bg-amber-400 text-slate-950 border-white shadow-[0_0_28px_rgba(255,122,0,0.85)]'
                : 'bg-[#2B1209]/95 text-amber-300 border-amber-500/70 hover:border-amber-400'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
            <div className="text-left">
              <div className="text-xs sm:text-base leading-none">PUSH PULSE</div>
              <div className="text-[10px] font-mono-tabular opacity-80 mt-0.5 hidden sm:block">
                SPACE / RIGHT-CLICK
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
