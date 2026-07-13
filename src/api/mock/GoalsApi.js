import { delay, coachingDelay, cloneDeep } from './utils';
import * as goalsStore from './goalsStore';

class MockApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'MockApiError';
    this.status = status;
    this.code = code;
  }
}

function apiError(status, code, message) {
  return new MockApiError(status, code, message);
}

export class GoalsApi {
  async getActiveGoal() {
    await delay();
    return cloneDeep(goalsStore.getActiveGoal());
  }

  async createGoal({ title, category }) {
    await coachingDelay();
    if (!title) throw apiError(400, 'INVALID_REQUEST', 'title 이 필요합니다.');
    return cloneDeep(goalsStore.createGoal({ title, category }));
  }

  async archiveGoal(goalId) {
    await delay();
    const goal = goalsStore.archiveGoal(goalId);
    if (!goal) throw apiError(404, 'NOT_FOUND', '목표를 찾을 수 없습니다.');
    return cloneDeep(goal);
  }

  async getCoaching(goalId) {
    await delay();
    const coaching = goalsStore.getCoaching(goalId);
    if (!coaching) throw apiError(404, 'NOT_FOUND', '목표를 찾을 수 없습니다.');
    return cloneDeep(coaching);
  }

  async applyRecommendation(goalId, recommendationId) {
    await delay();
    const result = goalsStore.applyRecommendation(goalId, recommendationId);
    if (!result) throw apiError(404, 'NOT_FOUND', '추천을 찾을 수 없습니다.');
    return cloneDeep(result);
  }

  async cancelRecommendation(goalId, recommendationId) {
    await delay();
    const item = goalsStore.cancelRecommendation(goalId, recommendationId);
    if (!item) throw apiError(404, 'NOT_FOUND', '추천을 찾을 수 없습니다.');
    return cloneDeep(item);
  }
}
