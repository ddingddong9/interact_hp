export const wrapIndex = (index: number, count: number) => ((index % count) + count) % count;
/** Recycle the existing book into the closest revolution without duplicating links. */
export function nearestBookShift(baseCenter: number, position: number, viewportCenter: number, period: number) {
  return period > 0 ? Math.round((viewportCenter - position - baseCenter) / period) * period : 0;
}
export function rebaseShelf(position: number, period: number) {
  return period > 0 ? position - Math.round(position / period) * period : position;
}
