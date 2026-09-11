/**
 * D-pad style focus movement for menus.
 *
 * Tab order already works, but on a TV remote, a controller, or just a
 * player who never touches the mouse, arrow keys should walk the grid the way
 * the eye does. This hook listens for arrow keys inside a container and moves
 * focus to the nearest *visible* interactive element in that direction —
 * geometric nearest-neighbour, so a 2×3 card grid behaves like a grid rather
 * than a list.
 */
import { useEffect, type RefObject } from 'react';

const CANDIDATE =
  'button:not([disabled]), a[href], [role="button"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])';

function visible(el: HTMLElement) {
  if (el.getAttribute('aria-hidden') === 'true') return false;
  if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return false;
  if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
  const r = el.getBoundingClientRect();
  return r.width > 1 && r.height > 1;
}

function centre(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function useArrowNav(ref: RefObject<HTMLElement | null>, opts: { active?: boolean } = {}) {
  const { active = true } = opts;
  useEffect(() => {
    const root = ref.current;
    if (!root || !active) return;

    const onKey = (e: KeyboardEvent) => {
      const dir =
        e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : null;
      if (!dir) return;
      // Never hijack arrows inside a text field or a scrollable region that
      // clearly owns the gesture.
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      const items = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE)).filter(visible);
      if (items.length === 0) return;

      const current = items.find((el) => el === document.activeElement || el.contains(document.activeElement)) ?? null;
      if (!current) {
        e.preventDefault();
        items[0].focus();
        return;
      }

      const from = centre(current);
      let best: HTMLElement | null = null;
      let bestScore = Infinity;
      for (const el of items) {
        if (el === current) continue;
        const to = centre(el);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        // Distance along the pressed axis, plus twice the drift across it.
        let primary: number;
        let cross: number;
        if (dir === 'left') { primary = -dx; cross = Math.abs(dy); }
        else if (dir === 'right') { primary = dx; cross = Math.abs(dy); }
        else if (dir === 'up') { primary = -dy; cross = Math.abs(dx); }
        else { primary = dy; cross = Math.abs(dx); }
        if (primary <= 4) continue;
        const score = primary + cross * 2;
        if (score < bestScore) {
          bestScore = score;
          best = el;
        }
      }

      e.preventDefault();
      if (best) best.focus();
      else {
        // Nothing that way: wrap around the container.
        const wrap = dir === 'left' || dir === 'up' ? items[items.length - 1] : items[0];
        wrap.focus();
      }
    };

    root.addEventListener('keydown', onKey);
    return () => root.removeEventListener('keydown', onKey);
  }, [ref, active]);
}
