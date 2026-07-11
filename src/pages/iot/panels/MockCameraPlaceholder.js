import { useEffect, useRef } from 'react';
import { MOCK_CAMERA_PLACEHOLDER } from '../../../lib/mockCameraStream';

export function MockCameraPlaceholder({
  className,
  alt = '목업 카메라',
  onReady,
}) {
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  return (
    <img
      className={className}
      src={MOCK_CAMERA_PLACEHOLDER}
      alt={alt}
      decoding="async"
      onLoad={() => onReadyRef.current?.()}
    />
  );
}
