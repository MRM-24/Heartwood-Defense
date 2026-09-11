import { Download, Share, Smartphone, WifiOff } from 'lucide-react';
import { BACK_PRIORITY, useBackHandler } from '../game/backstack';
import type { InstallState } from '../game/pwa';
import { ModalBody, ModalHeader, ModalShell, ThornButton } from './ui';
import { FloraSprite } from './sprites';

/**
 * The install offer.
 *
 * Shown once, on the first visit, and only when the device actually has a way
 * to install (Chrome/Edge/Android fire `beforeinstallprompt`; iOS Safari gets
 * the Share-sheet walkthrough). Whatever the player answers is remembered, so
 * this never reappears on its own — the Install button on the title screen
 * stays available for anyone who changes their mind.
 */
export default function InstallPrompt({
  install,
  onClose,
}: {
  install: InstallState;
  onClose: () => void;
}) {
  const ios = install.iosManual && !install.canPrompt;

  const dismiss = () => {
    install.later();
    onClose();
  };
  const never = () => {
    install.decline();
    onClose();
  };

  useBackHandler(dismiss, { priority: BACK_PRIORITY.dialog });

  return (
    <ModalShell onClose={dismiss} width="max-w-lg" z="z-[70]" label="Install Heartwood Defense">
      <ModalHeader
        title={<h2 className="font-display text-2xl font-black text-[#a3f2a0] sm:text-3xl">Install the app</h2>}
        subtitle="Optional — the game plays fine in the browser."
        onClose={dismiss}
        closeLabel="Not now"
      />
      <ModalBody>
        <div className="flex items-center gap-4">
          <div className="h-16 w-14 shrink-0">
            <FloraSprite k="thornvine" />
          </div>
          <div className="min-w-0 font-ui text-[13.5px] leading-relaxed text-[#b9cbb2]">
            Add <b className="text-[#eaffd9]">Heartwood Defense</b> to your home screen and it opens like any other
            app: full screen, its own icon, and the whole vale cached for offline play.
          </div>
        </div>

        <ul className="mt-5 space-y-2.5 font-ui text-[13px] text-[#b9cbb2]">
          <Benefit icon={<WifiOff className="h-4 w-4" />} title="Works offline">
            All 25 levels are stored on your device after the first load.
          </Benefit>
          <Benefit icon={<Smartphone className="h-4 w-4" />} title="Full-screen, no browser chrome">
            No address bar stealing the lanes, no accidental swipe-to-refresh.
          </Benefit>
          <Benefit icon={<Download className="h-4 w-4" />} title="Tiny and instant">
            The whole game is one HTML file — nothing to download from a store.
          </Benefit>
        </ul>

        {ios && (
          <div className="mt-5 rounded-xl border border-[#4a7a52]/60 bg-[#101d13] p-4">
            <div className="font-ui text-[11px] font-extrabold tracking-[0.3em] text-[#7f9a85]">ON IPHONE / IPAD</div>
            <ol className="mt-3 space-y-2.5 font-ui text-[13px] leading-relaxed text-[#b9cbb2]">
              <li className="flex items-center gap-3">
                <Step n="1" />
                Tap the <Share className="inline h-4 w-4 text-[#7fd4ff]" aria-label="Share" /> Share button in Safari&rsquo;s
                toolbar.
              </li>
              <li className="flex items-center gap-3">
                <Step n="2" />
                Choose <b className="text-[#eaffd9]">Add to Home Screen</b>.
              </li>
              <li className="flex items-center gap-3">
                <Step n="3" />
                Tap <b className="text-[#eaffd9]">Add</b> — the icon lands next to your other apps.
              </li>
            </ol>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          <ThornButton
            variant="primary"
            size="md"
            wide
            onClick={() => {
              if (install.canPrompt) void install.promptInstall().then(() => onClose());
              else dismiss();
            }}
          >
            {ios ? (
              <>
                <Share className="h-4 w-4" /> GOT IT
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> INSTALL APP
              </>
            )}
          </ThornButton>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ThornButton size="sm" wide onClick={dismiss} sfx="back">
              NOT NOW
            </ThornButton>
            <ThornButton size="sm" wide variant="ghost" onClick={never} sfx="none">
              DON&rsquo;T ASK AGAIN
            </ThornButton>
          </div>
        </div>

        <p className="mt-3 text-center font-ui text-[11px] font-semibold text-[#63796a]">
          Your choice is remembered on this device — you can install any time from the title screen.
        </p>
      </ModalBody>
    </ModalShell>
  );
}

function Benefit({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#2c4431] bg-[#14241a] text-[#7fd77f]">
        {icon}
      </span>
      <span>
        <b className="text-[#eaffd9]">{title}.</b> {children}
      </span>
    </li>
  );
}

function Step({ n }: { n: string }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#4a7a52] bg-[#1d3a24] font-ui text-[12px] font-extrabold text-[#a3f2a0]">
      {n}
    </span>
  );
}
