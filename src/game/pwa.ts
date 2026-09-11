/**
 * PWA plumbing: manifest/service-worker registration plus the "remember my
 * answer" state behind the install prompt.
 *
 * The install prompt is a *first-run* offer, not a nag: whatever the player
 * picks is stored in localStorage.
 *
 *   unset     → never asked on this device
 *   later     → "not now": stays quiet, but the Install button stays available
 *   dismissed → explicitly "don't ask again": never auto-opens again
 *   installed → running (or once ran) as an installed app
 */
import { useEffect, useState } from 'react';

const PREF_KEY = 'heartwood-install-pref-v1';

export type InstallPref = 'unset' | 'later' | 'dismissed' | 'installed';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function getInstallPref(): InstallPref {
  try {
    const v = localStorage.getItem(PREF_KEY);
    if (v === 'later' || v === 'dismissed' || v === 'installed') return v;
  } catch {
    /* private mode */
  }
  return 'unset';
}

export function setInstallPref(pref: InstallPref) {
  try {
    localStorage.setItem(PREF_KEY, pref);
  } catch {
    /* private mode */
  }
}

/** True when the app is already running as an installed/standalone app. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
  } catch {
    /* no matchMedia */
  }
  // iOS Safari predates the display-mode media query.
  return (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** iPadOS/iOS Safari can't fire beforeinstallprompt — it needs manual steps. */
export function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document);
  const webkit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return ios && webkit;
}

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  } catch {
    return 'ontouchstart' in window;
  }
}

/**
 * Register the service worker. Production only — a worker in front of Vite's
 * dev server just gets in the way of HMR.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  const prod = typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { PROD?: boolean } }).env?.PROD;
  if (!prod) return;
  const boot = () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* offline support is a bonus — never block the game on it */
    });
  };
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot, { once: true });
}

/**
 * Fade out and remove the inline `#boot` splash from index.html. Safe to call
 * more than once; a no-op if the element is already gone.
 */
export function dropBootSplash() {
  if (typeof document === 'undefined') return;
  const boot = document.getElementById('boot');
  if (!boot) return;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    boot.remove();
  };
  boot.style.transition = 'opacity 260ms ease-out';
  boot.addEventListener('transitionend', finish, { once: true });
  // Some engines skip transitionend (display:none, reduced motion) — trapdoor.
  window.setTimeout(finish, 600);
  requestAnimationFrame(() => {
    boot.style.opacity = '0';
  });
}

export interface InstallState {
  /** beforeinstallprompt fired and the browser will show its dialog on demand. */
  canPrompt: boolean;
  /** The native install dialog is available (Android/Chrome/Edge/desktop). */
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** iOS needs the manual "Share → Add to Home Screen" walkthrough. */
  iosManual: boolean;
  /** Already installed / launched from the home screen. */
  installed: boolean;
  pref: InstallPref;
  /** True while the first-run offer should be on screen. */
  offering: boolean;
  /** Player tapped "Install". */
  accept: () => void;
  /** Player tapped "Not now" — asked once more never. */
  decline: () => void;
  /** Player closed an in-app nudge but may be asked again later. */
  later: () => void;
}

/**
 * Install-prompt state machine. Holds the deferred `beforeinstallprompt` event
 * captured at boot, and remembers the player's answer across visits.
 */
export function useInstall(): InstallState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const [pref, setPref] = useState<InstallPref>(() => getInstallPref());
  const [offering, setOffering] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPref('installed');
      setInstallPref('installed');
      setOffering(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const iosManual = isIosSafari();
  const canPrompt = !!deferred && !installed;

  // First-run offer: only if the player has never answered and the platform
  // actually has a route to installation.
  useEffect(() => {
    if (installed) return;
    if (getInstallPref() !== 'unset') return;
    if (!deferred && !iosManual) return;
    const t = window.setTimeout(() => setOffering(true), 1400);
    return () => window.clearTimeout(t);
  }, [deferred, installed, iosManual]);

  const answer = (next: InstallPref) => {
    setPref(next);
    setInstallPref(next);
    setOffering(false);
  };

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferred) return 'unavailable';
    const ev = deferred;
    setDeferred(null);
    await ev.prompt();
    const choice = await ev.userChoice;
    if (choice.outcome === 'accepted') answer('installed');
    else answer('later');
    return choice.outcome;
  };

  return {
    canPrompt,
    promptInstall,
    iosManual,
    installed,
    pref,
    offering,
    accept: () => {
      void promptInstall();
      if (!deferred) answer('later');
    },
    decline: () => answer('dismissed'),
    later: () => answer('later'),
  };
}
