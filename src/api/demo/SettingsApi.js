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

  getRooms() {
    return realSettingsApi.getRooms();
  }

  getRoomMembers(roomId) {
    return realSettingsApi.getRoomMembers(roomId);
  }

  getDevices() {
    return realSettingsApi.getDevices();
  }

  switchActiveAccount(accountId) {
    return realSettingsApi.switchActiveAccount(accountId);
  }

  getSleepConfig() {
    return realSettingsApi.getSleepConfig();
  }

  getAiAgentSettings() {
    return realSettingsApi.getAiAgentSettings();
  }

  updateAiAgentSettings(payload) {
    return realSettingsApi.updateAiAgentSettings(payload);
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
