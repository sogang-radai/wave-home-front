import thumbSrs from '../img/device/thumbnail_srs_r4sn.png';
import thumbWaveStation from '../img/device/thumbnail_wave_station.png';
import thumbReolink from '../img/device/thumbnail_reolink_e1_pro.png';
import thumbDroidCam from '../img/device/thumbnail_droid_cam.png';
import thumbTuya from '../img/device/thumbnail_tuya_ep2h.png';
import thumbTizen from '../img/device/thumbnail_tizen_tv.png';
import thumbWiz from '../img/device/thumbnail_philips_wiz_e29.png';

/** Device class → 512px thumbnail; null when no image is available. */
export const deviceThumbnails = {
  srs_r4sn: thumbSrs,
  wave_station: thumbWaveStation,
  reolink_e1_pro: thumbReolink,
  droid_cam: thumbDroidCam,
  tuya_ep2h: thumbTuya,
  tizen_tv: thumbTizen,
  samsung_g7: thumbTizen,
  philips_wiz_e29_color: thumbWiz,
  philips_wiz_e29_white: thumbWiz,
};

export function getDeviceThumbnail(deviceClass) {
  return deviceThumbnails[deviceClass] ?? null;
}
