import { SettingsApi as MockSettingsApi } from '../mock/SettingsApi';
import { withDemoWriteGuard } from './guardedApi';

export const SettingsApi = withDemoWriteGuard(MockSettingsApi, [
  'switchActiveAccount',
  'createAccount',
  'updateAccount',
  'deleteAccount',
  'createRoom',
  'updateRoom',
  'deleteRoom',
  'updateRoomMembers',
  'createDevice',
  'updateDevice',
  'deleteDevice',
  'assignDeviceToRoom',
  'unassignDeviceFromRoom',
  'updateAiAgentSettings',
  'updateSleepConfig',
  'updateGeneralSettings',
  'markAllNotificationsRead',
]);
