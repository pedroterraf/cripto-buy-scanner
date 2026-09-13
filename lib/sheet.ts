import { SHEET_DECELERATION, SHEET_RUBBERBAND } from "@/lib/constants";

export function rubberbandOvershoot(
  overshoot: number,
  dimension: number,
  constant = SHEET_RUBBERBAND,
): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function projectTravel(velocityPxPerSec: number): number {
  return ((velocityPxPerSec / 1000) * SHEET_DECELERATION) / (1 - SHEET_DECELERATION);
}

export function readTranslateY(element: HTMLElement): number {
  const value = getComputedStyle(element).transform;
  if (!value || value === "none") return 0;
  return new DOMMatrix(value).m42;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
