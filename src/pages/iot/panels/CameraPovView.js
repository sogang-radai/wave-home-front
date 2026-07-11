import { useEffect, useMemo, useState } from 'react';
import { ModelHouseScene } from '../../../scene/ModelHouseScene';
import { setupLivingCamPov, hideNodeSubtree } from '../../homeTwin/twinCamera';
import { LIVING_CAM_NODE } from '../../../data/twinSceneConfig';
import '../../homeTwin/homeTwin.css';

/** Inline 3D living-room POV for the Reolink camera control panel. */
export function CameraPovView({ ptz }) {
  const [scene, setScene] = useState(null);
  const povConfig = useMemo(
    () => (scene ? setupLivingCamPov(scene, ptz.yaw, ptz.pitch, ptz.zoom) : null),
    [scene, ptz],
  );

  useEffect(() => {
    if (scene) hideNodeSubtree(scene, LIVING_CAM_NODE, true);
  }, [scene]);

  return (
    <ModelHouseScene
      className="camera-pov-inline"
      mode="camera-pov"
      selectedRoom="living_room"
      cameraMode="perspective"
      viewModels={[]}
      showLabels={false}
      hideNodes={[LIVING_CAM_NODE]}
      povConfig={povConfig || undefined}
      onSceneReady={setScene}
    />
  );
}
