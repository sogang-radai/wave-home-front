import { useEffect, useState } from 'react';
import iotApi from '../../api/iotApi';
import { IS_DEMO_MODE } from '../../api/config';

/** Poll demo speech overlays for twin device labels. Keys are deviceIds. */
export function useSpeechOverlays(enabled = true) {
  const [overlays, setOverlays] = useState({});

  useEffect(() => {
    if (!enabled || !IS_DEMO_MODE) {
      setOverlays({});
      return undefined;
    }

    let active = true;
    const load = () => {
      iotApi
        .getSpeechOverlays()
        .then((map) => {
          if (!active) return;
          setOverlays(map && typeof map === 'object' && !Array.isArray(map) ? map : {});
        })
        .catch(() => {
          if (active) setOverlays({});
        });
    };

    load();
    const timer = setInterval(load, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [enabled]);

  return overlays;
}
