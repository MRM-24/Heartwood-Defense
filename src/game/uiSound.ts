/**
 * Menu-wide feedback layer.
 *
 * One delegated listener on the document gives every interactive element the
 * same click language — no per-button wiring, and no chance of a new screen
 * shipping silent. Elements can override the sound with `data-sfx`:
 *
 *   <button data-sfx="back">     → falling "go back" pair
 *   <button data-sfx="denied">   → dull thud
 *   <button data-sfx="none">     → silent (the element plays its own sound)
 *
 * Pointer presses fire on `pointerdown` so feedback lands within ~100ms of the
 * tap (Apple HIG); keyboard activation (Enter/Space) fires on `keydown`, and
 * arrow-key focus moves tick. Clicks themselves are never listened to, so a
 * tap can't double-fire with its own focus event.
 */
import { playUiSound, type UiSound } from './sfx';

const INTERACTIVE = 'button, a[href], [role="button"], [data-sfx]';

type InputMode = 'pointer' | 'key';

let inputMode: InputMode = 'pointer';

function soundFor(el: Element): UiSound | null {
  const explicit = el.getAttribute('data-sfx');
  if (explicit === 'none') return null;
  if (explicit) return explicit as UiSound;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return 'denied';
  return 'confirm';
}

function isDisabled(el: Element) {
  return el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
}

function interactiveFrom(target: EventTarget | null): Element | null {
  if (!(target instanceof Element)) return null;
  return target.closest(INTERACTIVE);
}

/** Short haptic tap — confirms a placement or a rejected one. Silent on desktop. */
export function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported / blocked */
  }
}

/** Play a specific menu sound from a component (e.g. a mutated game state). */
export function uiSound(kind: UiSound) {
  playUiSound(kind);
}

export function installUiSounds(): () => void {
  if (typeof window === 'undefined') return () => {};

  const onPointerDown = (e: PointerEvent) => {
    inputMode = 'pointer';
    if (e.button !== 0) return;
    const el = interactiveFrom(e.target);
    if (!el) return;
    const kind = isDisabled(el) ? 'denied' : soundFor(el);
    if (kind) playUiSound(kind);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    inputMode = 'key';
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    const el = interactiveFrom(document.activeElement);
    if (!el) return;
    const kind = isDisabled(el) ? 'denied' : soundFor(el);
    if (kind) playUiSound(kind);
  };

  const onFocusIn = (e: FocusEvent) => {
    if (inputMode !== 'key') return;
    const el = interactiveFrom(e.target);
    if (!el || isDisabled(el)) return;
    playUiSound('tick');
  };

  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('focusin', onFocusIn, true);
  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('focusin', onFocusIn, true);
  };
}
