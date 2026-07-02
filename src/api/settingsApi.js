import { USE_MOCK_API } from './config';
import { SettingsApi as MockSettingsApi } from './mock/SettingsApi';
import { SettingsApi as RealSettingsApi } from './v1/SettingsApi';

const SettingsApiImpl = USE_MOCK_API ? MockSettingsApi : RealSettingsApi;

const settingsApi = new SettingsApiImpl();
export default settingsApi;
