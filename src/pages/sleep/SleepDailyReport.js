import { CareReport } from '../../components/report/CareReport';
import { SleepStatusReport } from './SleepStatusReport';

export function SleepDailyReport({ weeklyReport }) {
  return (
    <CareReport
      type="daily"
      header={<SleepStatusReport weeklyReport={weeklyReport} />}
      analysis={[]}
    />
  );
}
