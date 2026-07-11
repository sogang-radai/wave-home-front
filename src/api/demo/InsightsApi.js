import { InsightsApi as MockInsightsApi } from '../mock/InsightsApi';

// Insight decisions are simulated in memory by the demo client and never
// forwarded to the persistent insights API.
export class InsightsApi extends MockInsightsApi {}
