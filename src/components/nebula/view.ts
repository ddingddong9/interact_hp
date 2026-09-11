export const HORIZONTAL_ARC = Math.PI * 2;
export const VERTICAL_ARC = Math.PI;
export const PANORAMA_OVERLAP = .12;
export const PANORAMA_PERIOD = 1 - PANORAMA_OVERLAP;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const wrapYaw = (angle: number) => ((angle + Math.PI) % HORIZONTAL_ARC + HORIZONTAL_ARC) % HORIZONTAL_ARC - Math.PI;

// The last 12% of the photograph overlaps the first 12%, hiding the rear seam.
export function panoramaSample(longitude: number) {
  const u = (wrapYaw(longitude) / HORIZONTAL_ARC + .5) * PANORAMA_PERIOD;
  const blend = clamp(u / PANORAMA_OVERLAP, 0, 1);
  return { u, blend: blend * blend * (3 - 2 * blend) };
}

export function cameraLimits(aspect: number, requestedFov: number) {
  const safeAspect = Math.max(.1, aspect);
  const maximumFov = Math.min(.59, Math.atan(Math.tan(1.25) / safeAspect));
  const halfFov = clamp(requestedFov, Math.min(.2, maximumFov), maximumFov);
  return {
    halfFov,
    // Horizontal rotation is unbounded; keep the polar singularities out of view.
    pitch: Math.max(0, VERTICAL_ARC / 2 - halfFov - .045),
  };
}
