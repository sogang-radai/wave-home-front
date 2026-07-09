import { guardDemoWrite } from '../../lib/demoGuard';

/**
 * Wrap an API class so named methods show a demo popup instead of persisting writes.
 */
export function withDemoWriteGuard(ApiClass, writeMethodNames) {
  class GuardedApi extends ApiClass {}

  writeMethodNames.forEach((name) => {
    GuardedApi.prototype[name] = async function guardedWrite(...args) {
      if (!guardDemoWrite()) return null;
      return ApiClass.prototype[name].apply(this, args);
    };
  });

  return GuardedApi;
}
