/**
 * Full-bleed stage fitting.
 *
 * The battlefield is authored once, at a fixed 1080×600 "playfield": every
 * game coordinate (grid, lanes, sprites, fx, the spawn line) lives in that box
 * and none of it is responsive. Screens are not fixed, so the *frame* around
 * the playfield is: when the room we are given has a different aspect ratio,
 * the frame grows and the extra margin is painted as forest (`StageDecor`)
 * instead of being left as a black bar.
 *
 * For a box of `availW × availH` CSS px, and `chrome` px of unscaled HUD that
 * shares the stage (desktop only):
 *
 *   scale  = min(availW / 1080, availH / (chrome + 600), MAX_STAGE_SCALE)
 *   frameW = availW / scale            (≥ 1080 by construction)
 *   frameH = availH / scale − chrome   (≥ 600 by construction)
 *
 * so `frameW × (chrome + frameH)` scaled by `scale` covers the box exactly:
 * the playfield keeps its proportions and the frame absorbs the difference.
 *
 * Pure maths with no DOM in it, on purpose — `scripts/test.ts` pins the fit for
 * a table of real viewports (desktop, ultrawide, phone landscape and portrait,
 * tablet) so a layout regression fails a test instead of shipping.
 */

/** Playfield width, stage px — the authored grid is 9 columns of 100. */
export const STAGE_W = 1080;
/** Playfield height, stage px — 5 lanes of 106 plus the eaves. */
export const STAGE_H = 600;
/** Gap between the HUD row and the field inside the desktop stage, stage px. */
export const STAGE_GAP = 12;

/** Never zoom the stage past this: a 4K panel would render 300px tiles. */
export const MAX_STAGE_SCALE = 3;
/** Below this the field is unreadable anyway; clamp rather than vanish. */
export const MIN_STAGE_SCALE = 0.15;

/** Decorative margin around the playfield, in stage px. */
export interface StagePad {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const NO_PAD: StagePad = { top: 0, right: 0, bottom: 0, left: 0 };

export interface StageFit {
  /** One uniform transform for the whole stage — the board is never scaled twice. */
  scale: number;
  /** Board frame size in stage px: the playfield plus its decorative margin. */
  frameW: number;
  frameH: number;
  /** The margin itself, split evenly so the playfield stays centred. */
  pad: StagePad;
  /** CSS px box to reserve for the scaled stage — equals the available box. */
  boxW: number;
  boxH: number;
}

/**
 * The fit used before anything has been measured (and in jsdom, where every
 * rect is zero): half size, no margin. Harmless, and it keeps the first paint
 * from jumping when real numbers arrive.
 */
export const IDLE_FIT: StageFit = {
  scale: 0.5,
  frameW: STAGE_W,
  frameH: STAGE_H,
  pad: NO_PAD,
  boxW: STAGE_W * 0.5,
  boxH: STAGE_H * 0.5,
};

/**
 * Fit the stage to a box.
 *
 * @param availW   width of the box the stage must cover, CSS px
 * @param availH   height of that box, CSS px
 * @param chrome   unscaled HUD height that shares the stage (desktop layout);
 *                 0 when the HUD lives outside the scaled stage (phones)
 * @param maxScale ceiling on the uniform scale
 */
export function fitStage(
  availW: number,
  availH: number,
  chrome = 0,
  maxScale = MAX_STAGE_SCALE,
): StageFit {
  if (!Number.isFinite(availW) || !Number.isFinite(availH) || availW < 8 || availH < 8) {
    return IDLE_FIT;
  }
  const head = Math.max(0, Number.isFinite(chrome) ? chrome : 0);
  // The largest scale at which the playfield *and* its chrome still fit.
  const scale = Math.max(
    MIN_STAGE_SCALE,
    Math.min(availW / STAGE_W, availH / (head + STAGE_H), maxScale),
  );
  // Then grow the frame until the scaled stage covers the box exactly. Both
  // max()es are guards only — the scale above already promises the minimums.
  const frameW = Math.max(STAGE_W, availW / scale);
  const frameH = Math.max(STAGE_H, availH / scale - head);
  const padX = frameW - STAGE_W;
  const padY = frameH - STAGE_H;
  return {
    scale,
    frameW,
    frameH,
    pad: { top: padY / 2, right: padX / 2, bottom: padY / 2, left: padX / 2 },
    boxW: Math.min(availW, frameW * scale),
    boxH: Math.min(availH, (head + frameH) * scale),
  };
}

/** True when two fits agree to within a hair — stops resize feedback loops. */
export function sameFit(a: StageFit, b: StageFit, eps = 0.01): boolean {
  return (
    Math.abs(a.scale - b.scale) < eps &&
    Math.abs(a.frameW - b.frameW) < eps &&
    Math.abs(a.frameH - b.frameH) < eps
  );
}
