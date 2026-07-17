import { ApiError } from '../v1/httpClient';

export class SttApi {
  async createSession() {
    throw new ApiError(503, 'STT_UNAVAILABLE', '음성 인식을 사용할 수 없습니다.');
  }

  streamEvents() {
    return () => {};
  }

  async pushAudio() {
    throw new ApiError(503, 'STT_UNAVAILABLE', '음성 인식을 사용할 수 없습니다.');
  }

  async endSession() {
    throw new ApiError(503, 'STT_UNAVAILABLE', '음성 인식을 사용할 수 없습니다.');
  }

  async abortSession() {
    return null;
  }
}
