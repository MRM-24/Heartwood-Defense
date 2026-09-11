/**
 * Shared UI primitives.
 *
 * Escape and the system back button are handled one level up, in
 * `game/backstack.ts` — every surface here registers a layer with
 * `useBackHandler` instead of listening for keys itself.
 *
 * Everything here follows the same rules so the whole app stays consistent:
 *  · tap targets are ≥44×44pt (Apple HIG) / ≥48dp (Android)
 *  · press feedback is transform-only, so nothing shifts layout
 *  · modals are centred dialogs on desktop and bottom sheets on phones,
 *    always with an Escape/back route out
 *  · focus is moved into a dialog and restored to its trigger on close
 */
import { useCallback, useEffect, useRef, type ReactNode } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// ── button ──────────────────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'default' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] px-4 py-2.5 text-[13px]',
  md: 'min-h-[48px] px-6 py-3 text-[15px]',
  lg: 'min-h-[56px] px-8 py-4 text-[16px]',
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'border-[#ffd76a] bg-gradient-to-b from-[#3a2c0f] to-[#241a08] text-[#ffd76a] shadow-[0_0_24px_rgba(255,215,106,.25)] hover:shadow-[0_0_34px_rgba(255,215,106,.45)] hover:brightness-110',
  default:
    'border-[#4a7a52] bg-[#142418] text-[#bfe3bb] hover:border-[#7fd77f] hover:text-[#e3ffe0]',
  danger: 'border-[#ff5d7c]/70 bg-[#2a0e18] text-[#ff9db1] hover:bg-[#3a1622]',
  ghost: 'border-transparent bg-transparent text-[#9db08f] hover:text-[#e3ffe0]',
};

export function ThornButton({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  wide,
  disabled,
  title,
  ariaLabel,
  sfx,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  /** `primary` wins, `danger` warns, `ghost` recedes. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  wide?: boolean;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  /** Override the menu click sound (`none` for buttons that play their own). */
  sfx?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      data-sfx={sfx}
      className={`pressable group relative inline-flex items-center justify-center gap-2.5 rounded-xl border font-ui font-extrabold tracking-widest ${
        wide ? 'w-full' : ''
      } ${SIZES[size]} ${
        disabled
          ? 'cursor-not-allowed border-[#2c4431] bg-[#10180f] text-[#55695c]'
          : VARIANTS[variant]
      } ${className}`}
    >
      {children}
    </button>
  );
}

/** Square icon-only control with a guaranteed 44px hit area. */
export function IconButton({
  children,
  onClick,
  label,
  title,
  className = '',
  sfx,
  disabled,
  size = 44,
}: {
  children: ReactNode;
  onClick?: () => void;
  /** Required: icon-only buttons must be announced (WCAG 4.1.2). */
  label: string;
  title?: string;
  className?: string;
  sfx?: string;
  disabled?: boolean;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title ?? label}
      data-sfx={sfx}
      style={{ width: size, height: size }}
      className={`pressable inline-flex shrink-0 items-center justify-center rounded-xl border border-[#3a5a3f] bg-[#101d13] text-[#9db08f] hover:border-[#7fd77f] hover:text-[#e3ffe0] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

// ── modal scaffolding ───────────────────────────────────────────────────────
/**
 * Moves focus into a freshly-opened panel, keeps Tab inside it, and hands
 * focus back to whatever opened it. Restoring to the trigger keeps keyboard
 * and screen-reader position stable across open/close (WCAG 2.4.3).
 */
function useDialogFocus(active: boolean) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;
    restoreRef.current = document.activeElement;
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus({ preventScroll: true });
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (current === first || !panelRef.current.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      const back = restoreRef.current as HTMLElement | null;
      if (back && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, [active]);

  return panelRef;
}

/**
 * Dialog shell. Desktop: a centred card. Phone: a bottom sheet with a grab
 * handle, safe-area padding and its own scroll region so long content never
 * fights the page. Clicking the scrim dismisses (an escape route, per HIG).
 */
export function ModalShell({
  children,
  onClose,
  width = 'max-w-3xl',
  z = 'z-50',
  label,
  /** Set false for dialogs that must not be dismissed by a stray tap. */
  scrimClose = true,
  className = '',
}: {
  children: ReactNode;
  onClose?: () => void;
  width?: string;
  z?: string;
  label?: string;
  scrimClose?: boolean;
  className?: string;
}) {
  const panelRef = useDialogFocus(true);
  const handleScrim = useCallback(() => {
    if (scrimClose) onClose?.();
  }, [onClose, scrimClose]);

  return (
    <div
      className={`anim-scrimin fixed inset-0 ${z} flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4`}
      onClick={scrimClose ? handleScrim : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={`anim-sheetup sm:anim-dialogin flex max-h-[min(92dvh,900px)] w-full flex-col overflow-hidden rounded-t-3xl border border-[#4a7a52] bg-[#0f1c12] shadow-2xl outline-none sm:rounded-2xl ${width} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

/** Grab handle — the visual cue that a sheet can be dismissed (mobile only). */
export function SheetHandle() {
  return (
    <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
      <span className="h-1.5 w-12 rounded-full bg-[#3a5a3f]" />
    </div>
  );
}

/** Scrollable body inside a sheet/dialog, with safe-area bottom padding. */
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,var(--safe-bottom))] sm:px-7 sm:pb-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** Sticky header for sheet-style dialogs: title on the left, close on the right. */
export function ModalHeader({
  title,
  subtitle,
  onClose,
  closeLabel = 'Close',
  right,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  right?: ReactNode;
}) {
  return (
    <div className="shrink-0 px-4 pt-3 sm:px-7 sm:pt-6">
      <SheetHandle />
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {typeof title === 'string' ? (
            <h2 className="font-display text-2xl font-black text-[#a3f2a0] sm:text-3xl">{title}</h2>
          ) : (
            title
          )}
          {subtitle && <div className="mt-1 font-ui text-[12px] text-[#7f9a85]">{subtitle}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {right}
          {onClose && (
            <IconButton label={closeLabel} onClick={onClose} sfx="close">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small framed card, reused by the guide's stat blocks and notes. */
export function PanelCard({
  children,
  tone = 'leaf',
  className = '',
}: {
  children: ReactNode;
  tone?: 'leaf' | 'blight' | 'gold';
  className?: string;
}) {
  const tones = {
    leaf: 'border-[#2c4431] bg-[#101d13]',
    blight: 'border-[#33243a] bg-[#1a121f]',
    gold: 'border-[#3a2c0f] bg-[#241f0e]',
  } as const;
  return <div className={`rounded-xl border p-4 ${tones[tone]} ${className}`}>{children}</div>;
}
