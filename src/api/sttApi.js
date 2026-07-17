import { API_MODE } from './config';
import { SttApi as MockSttApi } from './mock/SttApi';
import { SttApi as RealSttApi } from './v1/SttApi';
import { SttApi as DemoSttApi } from './demo/SttApi';

function resolveSttApiClass() {
  if (API_MODE === 'demo') return DemoSttApi;
  if (API_MODE === 'real') return RealSttApi;
  return MockSttApi;
}

const sttApi = new (resolveSttApiClass())();
export default sttApi;
