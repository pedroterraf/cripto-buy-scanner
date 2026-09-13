"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import {
  SHEET_ANIMATION_MS,
  SHEET_CLOSE_RATIO,
  SHEET_DRAG_THRESHOLD_PX,
  SHEET_FLICK_PX_PER_MS,
} from "@/lib/constants";
import { prefersReducedMotion, projectTravel, readTranslateY, rubberbandOvershoot } from "@/lib/sheet";

interface MobileSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  origin: number;
  dragging: boolean;
  samples: { time: number; y: number }[];
}

const SHEET_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";

export function MobileSheet({ open, onClose, children }: MobileSheetProps) {
  const [shown, setShown] = useState(open);
  const sheetRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const offsetRef = useRef(0);
  const animationRef = useRef<Animation | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const gestureCloseRef = useRef(false);
  const suppressClickRef = useRef(false);
  const openRef = useRef(open);
  const prevOpenRef = useRef(open);
  onCloseRef.current = onClose;
  openRef.current = open;

  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;
    if (open) {
      gestureCloseRef.current = false;
      setShown(true);
      if (!wasOpen && shown) void settleTo(0);
      return;
    }
    if (gestureCloseRef.current || !shown) return;
    const panel = panelRef.current;
    if (!panel) {
      setShown(false);
      return;
    }
    void settleTo(panel.offsetHeight).then(() => {
      if (!openRef.current) setShown(false);
    });
  }, [open, shown]);

  useLayoutEffect(() => {
    if (!shown) return;
    const panel = panelRef.current;
    if (!panel) return;
    const height = panel.offsetHeight;
    panel.style.transform = `translate3d(0, ${height}px, 0)`;
    offsetRef.current = height;
    syncBackdrop(1);
    if (prefersReducedMotion()) {
      panel.style.transform = "translate3d(0, 0, 0)";
      offsetRef.current = 0;
      syncBackdrop(0);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      void settleTo(0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [shown]);

  function syncBackdrop(progress: number): void {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    backdrop.style.opacity = String(1 - Math.min(1, Math.max(0, progress)));
  }

  async function settleTo(y: number): Promise<void> {
    const panel = panelRef.current;
    if (!panel) return;
    animationRef.current?.cancel();
    if (prefersReducedMotion()) {
      panel.style.transform = `translate3d(0, ${y}px, 0)`;
      offsetRef.current = y;
      syncBackdrop(panel.offsetHeight ? y / panel.offsetHeight : 0);
      return;
    }
    const from = readTranslateY(panel);
    const anim = panel.animate(
      [
        { transform: `translate3d(0, ${from}px, 0)` },
        { transform: `translate3d(0, ${y}px, 0)` },
      ],
      { duration: SHEET_ANIMATION_MS, easing: SHEET_EASE, fill: "forwards" },
    );
    animationRef.current = anim;
    const height = panel.offsetHeight;
    const start = performance.now();
    const fromProgress = height ? from / height : 0;
    const toProgress = height ? y / height : 0;
    const tick = (now: number) => {
      if (animationRef.current !== anim) return;
      const t = Math.min(1, (now - start) / SHEET_ANIMATION_MS);
      syncBackdrop(fromProgress + (toProgress - fromProgress) * t);
      if (t < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
    await anim.finished.catch(() => undefined);
    if (animationRef.current !== anim) return;
    panel.style.transform = `translate3d(0, ${y}px, 0)`;
    anim.cancel();
    offsetRef.current = y;
    syncBackdrop(height ? y / height : 0);
  }

  function onPointerDown(event: PointerEvent<HTMLElement>): void {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target;
    if (!(target instanceof Element) || !target.closest("[data-sheet-chrome]")) return;
    const panel = panelRef.current;
    if (!panel) return;
    animationRef.current?.cancel();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: readTranslateY(panel),
      dragging: false,
      samples: [{ time: event.timeStamp, y: event.clientY }],
    };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>): void {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.dragging) {
      if (Math.hypot(dx, dy) < SHEET_DRAG_THRESHOLD_PX) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        dragRef.current = null;
        return;
      }
      drag.dragging = true;
      panel.setPointerCapture(event.pointerId);
      sheetRef.current?.classList.add("dragging");
    }
    const height = panel.offsetHeight;
    const raw = drag.origin + dy;
    const y = raw < 0 ? -rubberbandOvershoot(-raw, height) : raw;
    panel.style.transform = `translate3d(0, ${y}px, 0)`;
    offsetRef.current = y;
    syncBackdrop(height ? y / height : 0);
    drag.samples.push({ time: event.timeStamp, y: event.clientY });
    if (drag.samples.length > 5) drag.samples.shift();
  }

  function dragVelocity(drag: DragState): number {
    if (drag.samples.length < 2) return 0;
    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const elapsed = last.time - first.time;
    if (elapsed <= 0) return 0;
    return (last.y - first.y) / elapsed;
  }

  function onPointerUp(event: PointerEvent<HTMLElement>): void {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel || event.pointerId !== drag.pointerId) return;
    dragRef.current = null;
    if (!drag.dragging) return;
    suppressClickRef.current = true;
    if (panel.hasPointerCapture(event.pointerId)) {
      panel.releasePointerCapture(event.pointerId);
    }
    sheetRef.current?.classList.remove("dragging");
    const height = panel.offsetHeight;
    const y = offsetRef.current;
    const velocity = dragVelocity(drag);
    const projected = y + projectTravel(velocity * 1000);
    const shouldClose = projected > height * SHEET_CLOSE_RATIO || velocity > SHEET_FLICK_PX_PER_MS;
    if (!shouldClose) {
      void settleTo(0);
      return;
    }
    gestureCloseRef.current = true;
    void settleTo(height).then(() => {
      onCloseRef.current();
      setShown(false);
    });
  }

  function onClickCapture(event: MouseEvent<HTMLDivElement>): void {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }

  if (!shown) return null;

  return (
    <div
      ref={sheetRef}
      className="sheet"
      role="presentation"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
    >
      <button
        ref={backdropRef}
        className="backdrop"
        type="button"
        aria-label="Cerrar gráfico"
        onClick={() => onClose()}
      />
      <aside
        ref={panelRef}
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheetTitle"
      >
        {children}
      </aside>
    </div>
  );
}
