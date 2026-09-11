export type CollapsePhase = 'idle' | 'infall' | 'point' | 'restore';
export const INFALL_SECONDS = 6.6;
export const RESTORE_SECONDS = 3.4;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export class CollapseScene {
  phase: CollapsePhase = 'idle';
  elapsed = 0;
  progress = 0;
  x = .5;
  y = .5;

  get animating() { return this.phase === 'infall' || this.phase === 'restore'; }

  activate(x: number, y: number) {
    if (this.animating) return false;
    this.elapsed = 0;
    if (this.phase === 'point') this.phase = 'restore';
    else {
      this.x = clamp01(x);
      this.y = clamp01(y);
      this.progress = 0;
      this.phase = 'infall';
    }
    return true;
  }

  advance(seconds: number, reduced: boolean, paused: boolean) {
    if (!this.animating || paused) return;
    this.elapsed += Math.max(0, seconds);
    const duration = reduced ? .9 : this.phase === 'infall' ? INFALL_SECONDS : RESTORE_SECONDS;
    const amount = clamp01(this.elapsed / duration);
    this.progress = this.phase === 'infall' ? amount : 1 - amount * amount * (3 - 2 * amount);
    if (amount === 1) {
      this.phase = this.phase === 'infall' ? 'point' : 'idle';
      this.progress = this.phase === 'point' ? 1 : 0;
    }
  }

  reset() { this.phase = 'idle'; this.progress = 0; this.elapsed = 0; }
}

export type TapGesture = { id: number; x: number; y: number; start: number; moved: boolean };
export function isTap(gesture: TapGesture | null, id: number, x: number, y: number, time: number) {
  return !!gesture && gesture.id === id && !gesture.moved && time - gesture.start < 500
    && Math.hypot(x - gesture.x, y - gesture.y) < 8;
}
