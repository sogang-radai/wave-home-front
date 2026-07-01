import { CareReport } from '../../components/report/CareReport';
import { SleepStatusReport } from './SleepStatusReport';

export function SleepDailyReport() {
  return (
    <CareReport
      type="daily"
      header={<SleepStatusReport />}
      analysis={[]}
    />
  );
}
