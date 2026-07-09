import { createApiClient } from '../lib/apiRouter';
import { SettingsApi as MockSettingsApi } from './mock/SettingsApi';
import { SettingsApi as RealSettingsApi } from './v1/SettingsApi';
import { SettingsApi as DemoSettingsApi } from './demo/SettingsApi';

const settingsApi = createApiClient({
  mock: MockSettingsApi,
  real: RealSettingsApi,
  demo: DemoSettingsApi,
});
export default settingsApi;
