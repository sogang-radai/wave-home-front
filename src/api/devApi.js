import { DevApi } from './v1/DevApi';

// Developer tools are production-only; no mock/demo client is needed.
const devApi = new DevApi();
export default devApi;
