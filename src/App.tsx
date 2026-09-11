import { useCallback, useEffect, useMemo, useState } from 'react';
import GameScreen from './components/GameScreen';
import { GuideModal, LevelSelect, LoadoutScreen, TitleScreen, WorldSelect } from './components/Screens';
import { LEVELS, defaultLoadoutFor } from './game/data';
import { setBgmMuted, startBgm } from './game/bgm';
import { loadSave, recordWin, setMuted as persistMuted, type SaveData } from './game/save';
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
  const [picked, setPicked] = useState<FloraKey[]>([]);

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

  const hasSave = useMemo(() => save.maxLevel > 0 || Object.keys(save.stars).length > 0, [save]);

  const openLoadout = useCallback((level: LevelDef) => {
    // smart default: the classic spine plus unlocked hard counters for this level's intel
    setPicked(defaultLoadoutFor(level));
    setScreen({ name: 'loadout', level });
  }, []);

  const handleWin = useCallback(
    (level: LevelDef, snaresLeft: number) => {
      setSave((sv) => recordWin(sv, level.id, snaresLeft));
    },
    [],
  );

  const nextLevel = useCallback(
    (level: LevelDef): (() => void) | null => {
      if (level.id >= LEVELS.length - 1) return null;
      const next = LEVELS[level.id + 1];
      return () => openLoadout(next);
    },
    [openLoadout],
  );

  const toggleMute = useCallback(() => {
    setSave((sv) => persistMuted(sv, !sv.muted));
  }, []);

  switch (screen.name) {
    case 'title':
      return (
        <>
          <TitleScreen
            hasSave={hasSave}
            onPlay={() => setScreen({ name: 'worlds' })}
            onHow={() => setShowGuide(true)}
          />
          {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
        </>
      );
    case 'worlds':
      return (
        <WorldSelect
          maxLevel={save.maxLevel}
          stars={save.stars}
          onPick={(world) => setScreen({ name: 'levels', world })}
          onBack={() => setScreen({ name: 'title' })}
        />
      );
    case 'levels':
      return (
        <LevelSelect
          world={screen.world}
          maxLevel={save.maxLevel}
          stars={save.stars}
          onPick={openLoadout}
          onBack={() => setScreen({ name: 'worlds' })}
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
          onMute={toggleMute}
          onWin={(snaresLeft) => handleWin(screen.level, snaresLeft)}
          onExit={() => setScreen({ name: 'levels', world: screen.level.world })}
          onNext={nextLevel(screen.level)}
        />
      );
  }
}
