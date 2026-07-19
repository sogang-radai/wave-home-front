import { CareReport } from '../../components/report/CareReport';
import { SleepStatusReport } from './SleepStatusReport';

export function SleepDailyReport({ onReportDateChange, dateNavTarget }) {
  return (
    <CareReport
      type="daily"
      header={<SleepStatusReport onReportDateChange={onReportDateChange} dateNavTarget={dateNavTarget} />}
      analysis={[]}
    />
  );
}
