import { useCallback, useEffect, useMemo, useState } from 'react';
import GameScreen from './components/GameScreen';
import { GuideModal, LevelSelect, LoadoutScreen, TitleScreen, WorldSelect } from './components/Screens';
import { LEVELS, unlockedFloraFor } from './game/data';
import { loadSave, recordWin, setMuted as persistMuted, type SaveData } from './game/save';
import { setSfxMuted } from './game/sfx';
import type { FloraKey, LevelDef } from './game/types';

type Screen =
  | { name: 'title' }
  | { name: 'worlds' }
  | { name: 'levels'; world: 1 | 2 }
  | { name: 'loadout'; level: LevelDef }
  | { name: 'game'; level: LevelDef };

export default function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [screen, setScreen] = useState<Screen>({ name: 'title' });
  const [showGuide, setShowGuide] = useState(false);
  const [picked, setPicked] = useState<FloraKey[]>([]);

  useEffect(() => {
    setSfxMuted(save.muted);
  }, [save.muted]);

  const hasSave = useMemo(() => save.maxLevel > 0 || Object.keys(save.stars).length > 0, [save]);

  const openLoadout = useCallback((level: LevelDef) => {
    // smart default: everything unlocked, oldest first
    setPicked(unlockedFloraFor(level.id).slice(0, 6));
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
