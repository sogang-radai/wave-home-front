import { DroidCamCameraPanel } from './DroidCamCameraPanel';
import { ReolinkCameraPanel } from './ReolinkCameraPanel';

// Routes camera panels by device class. DroidCam never loads the fMP4 player.
export function CameraPanel({ device }) {
  if (device.class === 'droid_cam')
    return <DroidCamCameraPanel device={device} />;
  return <ReolinkCameraPanel device={device} />;
}
