import { SettingsApi as MockSettingsApi } from '../mock/SettingsApi';
import { SettingsApi as RealSettingsApi } from '../v1/SettingsApi';
import { withDemoWriteGuard } from './guardedApi';

const realSettingsApi = new RealSettingsApi();

const GuardedSettingsApi = withDemoWriteGuard(MockSettingsApi, [
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
]);

export class SettingsApi extends GuardedSettingsApi {
  getSession() {
    return realSettingsApi.getSession();
  }

  getAccounts() {
    return realSettingsApi.getAccounts();
  }

  switchActiveAccount(accountId) {
    return realSettingsApi.switchActiveAccount(accountId);
  }

  getSleepConfig() {
    return realSettingsApi.getSleepConfig();
  }

  getNotifications(params) {
    return realSettingsApi.getNotifications(params);
  }

  markAllNotificationsRead() {
    return realSettingsApi.markAllNotificationsRead();
  }

  markNotificationRead(notificationId) {
    return realSettingsApi.markNotificationRead(notificationId);
  }
}
