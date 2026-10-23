import { useCallback, useEffect, useState } from 'react';
import { GameCanvas, HUDTelemetry } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { GarageModal, OutcomeModal, PauseModal, SettingsModal } from './components/Modals';
import { TitleScreen } from './components/TitleScreen';
import { soundFX } from './game/audio';
import { ARENA_LEVELS } from './game/levels';
import { loadSaveData, saveGameData } from './game/storage';
import { GameSettings, GameState, RunSnapshot, SaveData, UpgradeLevels } from './game/types';

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [selectedArenaId, setSelectedArenaId] = useState<number>(1);
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'playing';
      }
    }
    return 'title';
  });

  const [activeSubModal, setActiveSubModal] = useState<'none' | 'garage' | 'settings'>('none');
  const [restartNonce, setRestartNonce] = useState<number>(0);
  const [externalPullHeld, setExternalPullHeld] = useState<boolean>(false);
  const [externalPushNonce, setExternalPushNonce] = useState<number>(0);
  const [touchMoveVec, setTouchMoveVec] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [outcomeSnapshot, setOutcomeSnapshot] = useState<RunSnapshot | null>(null);

  const [telemetry, setTelemetry] = useState<HUDTelemetry>({
    hp: 3,
    maxHp: 3,
    score: 0,
    combo: 1,
    crystalsEarned: 0,
    targetsCleared: 0,
    targetsTotal: 3,
    pulsesUsed: 0,
    elapsedSec: 0,
    polarity: 'idle',
    clusterCount: 0,
    tutorialStep: 0,
  });

  // Mirror game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Sync audio configuration
  useEffect(() => {
    soundFX.configure(saveData.settings.soundEnabled, saveData.settings.volume);
  }, [saveData.settings.soundEnabled, saveData.settings.volume]);

  const updateAndPersistSave = useCallback((updater: (prev: SaveData) => SaveData) => {
    setSaveData((prev) => {
      const next = updater(prev);
      saveGameData(next);
      return next;
    });
  }, []);

  const handleStartGame = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveSubModal('none');
    setOutcomeSnapshot(null);
    setExternalPullHeld(false);
    setRestartNonce((n) => n + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleRunComplete = useCallback(
    (snapshot: RunSnapshot) => {
      setExternalPullHeld(false);
      updateAndPersistSave((prev) => {
        const prevBest = prev.bestScores[snapshot.arenaId] ?? 0;
        const newBest = Math.max(prevBest, snapshot.score);
        const nextUnlocked = snapshot.victory
          ? Math.min(ARENA_LEVELS.length, Math.max(prev.highestUnlockedArena, snapshot.arenaId + 1))
          : prev.highestUnlockedArena;

        snapshot.bestScore = newBest;
        return {
          ...prev,
          crystals: prev.crystals + snapshot.crystalsEarned,
          highestUnlockedArena: nextUnlocked,
          bestScores: {
            ...prev.bestScores,
            [snapshot.arenaId]: newBest,
          },
        };
      });
      setOutcomeSnapshot(snapshot);
      document.body.dataset.state = 'gameover';
      setGameState('gameover');
    },
    [updateAndPersistSave]
  );

  const handleTogglePause = useCallback(() => {
    setExternalPullHeld(false);
    setGameState((prev) => {
      if (prev === 'playing') {
        soundFX.stopPullHum();
        document.body.dataset.state = 'paused';
        return 'paused';
      }
      if (prev === 'paused') {
        setActiveSubModal('none');
        document.body.dataset.state = 'playing';
        return 'playing';
      }
      return prev;
    });
  }, []);

  const handleQuickRestart = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setExternalPullHeld(false);
    setOutcomeSnapshot(null);
    setActiveSubModal('none');
    setRestartNonce((n) => n + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, []);

  const handleNextArena = useCallback(() => {
    const nextId = Math.min(ARENA_LEVELS.length, selectedArenaId + 1);
    setSelectedArenaId(nextId);
    setOutcomeSnapshot(null);
    setExternalPullHeld(false);
    setRestartNonce((n) => n + 1);
    document.body.dataset.state = 'playing';
    setGameState('playing');
  }, [selectedArenaId]);

  const handleQuitToTitle = useCallback(() => {
    soundFX.stopPullHum();
    setExternalPullHeld(false);
    setActiveSubModal('none');
    setOutcomeSnapshot(null);
    document.body.dataset.state = 'title';
    setGameState('title');
  }, []);

  const handleToggleMute = useCallback(() => {
    updateAndPersistSave((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: !prev.settings.soundEnabled,
      },
    }));
  }, [updateAndPersistSave]);

  const handleUpdateSettings = useCallback(
    (partial: Partial<GameSettings>) => {
      updateAndPersistSave((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...partial,
        },
      }));
    },
    [updateAndPersistSave]
  );

  const handleSelectSkin = useCallback(
    (skinId: string) => {
      updateAndPersistSave((prev) => ({
        ...prev,
        selectedSkin: skinId,
      }));
    },
    [updateAndPersistSave]
  );

  const handleUnlockSkin = useCallback(
    (skinId: string, cost: number) => {
      updateAndPersistSave((prev) => {
        if (prev.crystals < cost || prev.unlockedSkins.includes(skinId)) return prev;
        return {
          ...prev,
          crystals: prev.crystals - cost,
          unlockedSkins: [...prev.unlockedSkins, skinId],
          selectedSkin: skinId,
        };
      });
    },
    [updateAndPersistSave]
  );

  const handleUpgradeStat = useCallback(
    (stat: keyof UpgradeLevels, cost: number) => {
      updateAndPersistSave((prev) => {
        const currentLvl = prev.upgrades[stat];
        if (currentLvl >= 5 || prev.crystals < cost) return prev;
        return {
          ...prev,
          crystals: prev.crystals - cost,
          upgrades: {
            ...prev.upgrades,
            [stat]: currentLvl + 1,
          },
        };
      });
    },
    [updateAndPersistSave]
  );

  const currentArena = ARENA_LEVELS.find((a) => a.id === selectedArenaId) ?? ARENA_LEVELS[0];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#05070F] select-none">
      {/* Persistent Full-Viewport 3D WebGL Scene */}
      <GameCanvas
        gameState={gameState}
        arenaId={selectedArenaId}
        skinId={saveData.selectedSkin}
        upgrades={saveData.upgrades}
        settings={saveData.settings}
        restartNonce={restartNonce}
        externalPullHeld={externalPullHeld}
        externalPushTriggerNonce={externalPushNonce}
        touchMoveVec={touchMoveVec}
        onTelemetryUpdate={setTelemetry}
        onRunComplete={handleRunComplete}
        onTogglePause={handleTogglePause}
        onQuickRestart={handleQuickRestart}
        onToggleMute={handleToggleMute}
        onStartFromKey={handleStartGame}
      />

      {/* Title Screen Overlay */}
      {gameState === 'title' && activeSubModal === 'none' && (
        <TitleScreen
          saveData={saveData}
          selectedArenaId={selectedArenaId}
          onSelectArena={setSelectedArenaId}
          onStartGame={handleStartGame}
          onOpenGarage={() => setActiveSubModal('garage')}
          onOpenSettings={() => setActiveSubModal('settings')}
        />
      )}

      {/* Playing HUD Overlay */}
      {gameState === 'playing' && (
        <GameHUD
          arena={currentArena}
          hp={telemetry.hp}
          maxHp={telemetry.maxHp}
          score={telemetry.score}
          combo={telemetry.combo}
          crystals={saveData.crystals + telemetry.crystalsEarned}
          targetsCleared={telemetry.targetsCleared}
          targetsTotal={telemetry.targetsTotal}
          pulsesUsed={telemetry.pulsesUsed}
          elapsedSec={telemetry.elapsedSec}
          polarity={telemetry.polarity}
          clusterCount={telemetry.clusterCount}
          soundEnabled={saveData.settings.soundEnabled}
          tutorialStep={telemetry.tutorialStep}
          onToggleSound={handleToggleMute}
          onPause={handleTogglePause}
          onRestart={handleQuickRestart}
          onHoldPullStart={() => setExternalPullHeld(true)}
          onHoldPullEnd={() => setExternalPullHeld(false)}
          onTriggerPush={() => setExternalPushNonce((n) => n + 1)}
          onTouchMoveVector={(dx, dz) => setTouchMoveVec({ x: dx, z: dz })}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && activeSubModal === 'none' && (
        <PauseModal
          arenaName={currentArena.name}
          onResume={handleTogglePause}
          onRestart={handleQuickRestart}
          onOpenSettings={() => setActiveSubModal('settings')}
          onQuitToTitle={handleQuitToTitle}
        />
      )}

      {/* Victory / Defeat Outcome Modal */}
      {gameState === 'gameover' && outcomeSnapshot && (
        <OutcomeModal
          snapshot={outcomeSnapshot}
          onPlayAgain={handleQuickRestart}
          onNextArena={handleNextArena}
          onQuitToTitle={handleQuitToTitle}
        />
      )}

      {/* Garage & Upgrades Modal */}
      {activeSubModal === 'garage' && (
        <GarageModal
          saveData={saveData}
          onSelectSkin={handleSelectSkin}
          onUnlockSkin={handleUnlockSkin}
          onUpgradeStat={handleUpgradeStat}
          onClose={() => setActiveSubModal('none')}
        />
      )}

      {/* Settings Modal */}
      {activeSubModal === 'settings' && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setActiveSubModal('none')}
        />
      )}
    </main>
  );
}
