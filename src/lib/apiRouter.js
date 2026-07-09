import { API_MODE } from '../api/config';

/**
 * Pick mock / real / demo API implementation class for the current build.
 */
export function createApiClient({ mock, real, demo }) {
  const Impl = { mock, real, demo: demo ?? mock }[API_MODE] ?? mock;
  return new Impl();
}
