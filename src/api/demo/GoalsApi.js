import { GoalsApi as MockGoalsApi } from '../mock/GoalsApi';

// 목표 코칭은 데모 클라이언트가 메모리 상에서만 시뮬레이션하고 영구 저장소에는 반영하지 않는다.
export class GoalsApi extends MockGoalsApi {}
