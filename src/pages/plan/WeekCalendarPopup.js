import { MonthCalendarPopup } from '../../components/calendar/MonthCalendarPopup';

export function WeekCalendarPopup({ onSelectWeek, onClose }) {
  return (
    <MonthCalendarPopup
      mode="week"
      onSelectWeek={onSelectWeek}
      onClose={onClose}
      className="week-calendar-popup"
    />
  );
}
