import { useEffect, useRef, useState } from 'react';

/** Tracks an element's rendered height via ResizeObserver. Returns [ref, height]. */
export function useElementHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
