import { useCallback, useEffect, useMemo, useState } from 'react';
import GameScreen from './components/GameScreen';
import InstallPrompt from './components/InstallPrompt';
import { ConfirmDialog, GuideModal, LevelSelect, LoadoutScreen, TitleScreen, WorldSelect } from './components/Screens';
import { ENEMY_ORDER, FLORA_ORDER, LEVELS, defaultLoadoutFor } from './game/data';
import { setBgmMuted, startBgm } from './game/bgm';
import { isTouchDevice, useInstall } from './game/pwa';
import {
  codexEnemies,
  codexFlora,
  discoverLevel,
  levelsCleared,
  loadSave,
  recordWin,
  resetProgress,
  resumeLevelId,
  setMuted as persistMuted,
  totalStars,
  type SaveData,
} from './game/save';
import { setSfxMuted } from './game/sfx';
import type { FloraKey, LevelDef, WorldId } from './game/types';

type Screen =
  | { name: 'title' }
  | { name: 'worlds' }
  | { name: 'levels'; world: WorldId }
  | { name: 'loadout'; level: LevelDef }
  | { name: 'game'; level: LevelDef };

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  const [showGuide, setShowGuide] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [picked, setPicked] = useState<FloraKey[]>([]);
  const install = useInstall();

  useEffect(() => {
    setSfxMuted(save.muted);
    setBgmMuted(save.muted);
  }, [save.muted]);

  // Start the BGM on the first user gesture (browser autoplay policy).
  // startBgm() is idempotent, so it's safe to bind to every input.
  useEffect(() => {
    const boot = () => startBgm();
    window.addEventListener('pointerdown', boot, { passive: true });
    window.addEventListener('keydown', boot);
    return () => {
      window.removeEventListener('pointerdown', boot);
      window.removeEventListener('keydown', boot);
    };
  }, []);

  // First visit only: offer to install, unless the player already answered.
  useEffect(() => {
    if (install.offering) setShowInstall(true);
  }, [install.offering]);

  // What the Field Guide is allowed to show in full; everything else is a silhouette.
  const guideFlora = useMemo(() => codexFlora(save), [save]);
  const guideEnemies = useMemo(() => codexEnemies(save), [save]);

  const hasSave = useMemo(() => save.maxLevel > 0 || Object.keys(save.stars).length > 0, [save]);
  const resumeId = useMemo(() => resumeLevelId(save), [save]);
  const resumeLevel = LEVELS[resumeId];
  const resumeLabel = `World ${resumeLevel.world}-${resumeLevel.idx} · ${resumeLevel.name}`;

  const openLoadout = useCallback((level: LevelDef) => {
    // smart default: the classic spine plus unlocked hard counters for this level's intel
    setPicked(defaultLoadoutFor(level));
    // opening a level's briefing reveals what that level's intel names
    setSave((sv) => discoverLevel(sv, level.id));
    setScreen({ name: 'loadout', level });
  }, []);

  const handleWin = useCallback((level: LevelDef, snaresLeft: number) => {
    setSave((sv) => recordWin(sv, level.id, snaresLeft));
  }, []);

  const nextLevel = useCallback(
    (level: LevelDef): (() => void) | null => {
      if (level.id >= LEVELS.length - 1) return null;
      const next = LEVELS[level.id + 1];
      return () => openLoadout(next);
    },
    [openLoadout],
  );

  // CONTINUE drops you straight into the first level you have not cleared.
  const continueGame = useCallback(() => {
    openLoadout(LEVELS[resumeLevelId(save)]);
  }, [openLoadout, save]);

  // NEW GAME wipes the campaign (the Field Guide keeps its entries) and starts at 1-1.
  const startNewGame = useCallback(() => {
    setConfirmNew(false);
    setSave((sv) => resetProgress(sv));
    openLoadout(LEVELS[0]);
  }, [openLoadout]);

  const requestNewGame = useCallback(() => {
    if (hasSave) setConfirmNew(true);
    else startNewGame();
  }, [hasSave, startNewGame]);

  const toggleMute = useCallback(() => {
    setSave((sv) => persistMuted(sv, !sv.muted));
  }, []);

  const goTitle = useCallback(() => setScreen({ name: 'title' }), []);
  const goWorlds = useCallback(() => setScreen({ name: 'worlds' }), []);

  const openInstall = useCallback(() => setShowInstall(true), []);

  const installDialog = showInstall && (
    <InstallPrompt install={install} onClose={() => setShowInstall(false)} />
  );

  switch (screen.name) {
    case 'title':
      return (
        <>
          <TitleScreen
            hasSave={hasSave}
            resume={resumeLabel}
            stars={totalStars(save)}
            cleared={levelsCleared(save)}
            floraKnown={guideFlora.size}
            floraTotal={FLORA_ORDER.length}
            enemiesKnown={guideEnemies.size}
            enemiesTotal={ENEMY_ORDER.length}
            muted={save.muted}
            onContinue={continueGame}
            onNewGame={requestNewGame}
            onLevels={goWorlds}
            onGuide={() => setShowGuide(true)}
            onToggleMute={toggleMute}
            onInstall={openInstall}
            canInstall={install.canPrompt || install.iosManual}
            installed={install.installed}
            showKeyHints={!isTouchDevice()}
          />
          {showGuide && (
            <GuideModal unlockedFlora={guideFlora} unlockedEnemies={guideEnemies} onClose={() => setShowGuide(false)} />
          )}
          {confirmNew && (
            <ConfirmDialog
              title="Start Over?"
              body={
                <>
                  This clears your campaign: stars reset and the vale closes back up to World 1-1. Your{' '}
                  <b className="text-[#a3f2a0]">Field Guide</b> entries stay recorded, so nothing you have already
                  catalogued goes dark again.
                </>
              }
              confirmLabel="START OVER"
              onConfirm={startNewGame}
              onCancel={() => setConfirmNew(false)}
            />
          )}
          {installDialog}
        </>
      );
    case 'worlds':
      return (
        <WorldSelect
          maxLevel={save.maxLevel}
          stars={save.stars}
          onPick={(world) => setScreen({ name: 'levels', world })}
          onBack={goTitle}
        />
      );
    case 'levels':
      return (
        <LevelSelect
          world={screen.world}
          maxLevel={save.maxLevel}
          stars={save.stars}
          onPick={openLoadout}
          onBack={goWorlds}
          guideFlora={guideFlora}
          guideEnemies={guideEnemies}
        />
      );
    case 'loadout':
      return (
        <LoadoutScreen
          level={screen.level}
          picked={picked}
          setPicked={setPicked}
          onStart={() => picked.length > 0 && setScreen({ name: 'game', level: screen.level })}
          onBack={() => setScreen({ name: 'levels', world: screen.level.world })}
        />
      );
    case 'game':
      return (
        <GameScreen
          key={`${screen.level.id}`}
          level={screen.level}
          loadout={picked}
          muted={save.muted}
          guideFlora={guideFlora}
          guideEnemies={guideEnemies}
          onMute={toggleMute}
          onWin={(snaresLeft) => handleWin(screen.level, snaresLeft)}
          onExit={() => setScreen({ name: 'levels', world: screen.level.world })}
          onNext={nextLevel(screen.level)}
        />
      );
  }
}
