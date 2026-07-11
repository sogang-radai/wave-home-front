import { useEffect, useRef } from 'react';
import { API_BASE_URL, USE_PLACEHOLDER_CAMERA_STREAM } from '../../../api/config';
import { MockCameraPlaceholder } from './MockCameraPlaceholder';

function clearImageSource(img) {
  img.removeAttribute('src');
}

// DroidCam serves native MJPEG; proxy through wave-server instead of go2rtc fMP4.
export function DroidCamMjpegPlayer({
  deviceId,
  className,
  onReady,
  onError,
}) {
  const imgRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    if (USE_PLACEHOLDER_CAMERA_STREAM)
      return undefined;

    const img = imgRef.current;
    if (!img)
      return undefined;

    const stamp = Date.now();
    img.src = `${API_BASE_URL}/iot/devices/${deviceId}/stream/mjpeg?t=${stamp}`;

    const handleLoad = () => onReadyRef.current?.();
    const handleError = () => onErrorRef.current?.();

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      clearImageSource(img);
    };
  }, [deviceId]);

  if (USE_PLACEHOLDER_CAMERA_STREAM) {
    return (
      <MockCameraPlaceholder
        className={className}
        alt="폰 카메라 스트림"
        onReady={onReady}
      />
    );
  }

  return (
    <img
      ref={imgRef}
      className={className}
      alt="폰 카메라 스트림"
      decoding="async"
    />
  );
}
