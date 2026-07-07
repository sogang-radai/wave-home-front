import { useEffect, useRef } from 'react';
import { CameraStreamPlayer } from './CameraStreamPlayer';

// Single MSE player — avoids stacking WebRTC + MP4 connections.
export function CameraPlayer({
  deviceId,
  muted,
  className,
  onMicLevel,
  onReady,
  onError,
}) {
  const micAttachedRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onReady, onError]);

  useEffect(() => {
    micAttachedRef.current = false;
    readyRef.current = false;
  }, [deviceId]);

  const markReady = () => {
    if (readyRef.current)
      return;
    readyRef.current = true;
    onReadyRef.current?.();
  };

  return (
    <CameraStreamPlayer
      deviceId={deviceId}
      muted={muted}
      className={className}
      onMicLevel={onMicLevel}
      onReady={markReady}
      onError={() => onErrorRef.current?.()}
      micAttachedRef={micAttachedRef}
    />
  );
}
