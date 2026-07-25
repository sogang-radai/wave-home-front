import { IS_DEMO_MODE } from '../api/config';
import { showToast } from './toast';

export const DEMO_WRITE_DENIED_MESSAGE =
  '시연 모드에서는 변경 사항을 저장할 수 없습니다.';

/**
 * Returns true when the write may proceed; false when blocked (shows toast in demo).
 */
export function guardDemoWrite(message = DEMO_WRITE_DENIED_MESSAGE) {
  if (!IS_DEMO_MODE) return true;
  showToast(message);
  return false;
}
