import { useEffect, useState } from 'react';

const MOBILE_LAYOUT_QUERY = '(max-width: 760px)';

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_LAYOUT_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_LAYOUT_QUERY);
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
