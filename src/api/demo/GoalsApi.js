import { GoalsApi as RealGoalsApi } from '../v1/GoalsApi';

// 데모도 /api/v1/goals 를 호출한다. 서버가 세션 메모리에 목표·코칭을 보관한다.
export class GoalsApi extends RealGoalsApi {}
