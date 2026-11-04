"use client";

import { useCallback, useEffect, useState } from "react";

/** Auto-advancing slider state. Manual navigation restarts the timer; it keeps auto-playing. */
export function useSlider(count: number, intervalMs = 6500) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // restarts the timer after manual navigation

  const go = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      setTick((t) => t + 1);
    },
    [count]
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const running = !paused;
  useEffect(() => {
    if (!running || count < 2) return;
    const id = window.setTimeout(next, intervalMs);
    return () => window.clearTimeout(id);
  }, [running, next, intervalMs, count, tick]);

  return { index, go, next, prev, paused, setPaused, running, tick, intervalMs };
}
