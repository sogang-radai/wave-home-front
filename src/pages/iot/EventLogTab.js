import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import homeApi from '../../api/homeApi';
import { EVENT_TYPE_FILTERS, EVENT_TYPE_LABELS, formatRelativeTime, formatTriggeredBy } from './iotUtils';

// Shared timeline renderer — used both by the standalone 로그 tab and by a
// device's "로그" sub-tab (filtered to deviceId) inside IotControlTab.
export function EventTimeline({ events, rules, compact }) {
  const [openId, setOpenId] = useState(null);

  if (events.length === 0) {
    return <p className="panel-empty">표시할 이벤트가 없습니다.</p>;
  }

  return (
    <div className={`event-timeline${compact ? ' compact' : ''}`}>
      {events.map((event) => {
        const isOpen = openId === event.id;
        return (
          <article className="event-row" key={event.id}>
            <button type="button" className="event-row-main" onClick={() => setOpenId(isOpen ? null : event.id)}>
              <span className={`event-type-dot event-type-${event.type}`} />
              <div className="event-row-body">
                <strong>{event.message}</strong>
                <span className="event-row-meta">
                  <em className="event-type-badge">{EVENT_TYPE_LABELS[event.type]}</em>
                  {event.deviceName && <span>{event.deviceName}</span>}
                  <span>{formatTriggeredBy(event.triggeredBy, rules)}</span>
                </span>
              </div>
              <time>{formatRelativeTime(event.occurredAt)}</time>
            </button>
            {isOpen && (
              <pre className="event-detail-json">{JSON.stringify(event.detail, null, 2)}</pre>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function EventLogTab() {
  const [events, setEvents] = useState([]);
  const [rules, setRules] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeApi.getRules().then(setRules);
  }, []);

  useEffect(() => {
    setLoading(true);
    const types = filter === 'all' ? undefined : [filter];
    homeApi.getEvents({ types }).then((list) => { setEvents(list); setLoading(false); });
  }, [filter]);

  return (
    <Card title="통합 로그" wide>
      <div className="event-filter-chips">
        {EVENT_TYPE_FILTERS.map((f) => (
          <button key={f.id} type="button" className={`filter-chip${filter === f.id ? ' active' : ''}`} onClick={() => setFilter(f.id)}>
            {f.id !== 'all' && <span className={`event-type-dot event-type-${f.id}`} />}
            {f.label}
          </button>
        ))}
      </div>
      {loading ? <p className="panel-loading">불러오는 중…</p> : <EventTimeline events={events} rules={rules} />}
    </Card>
  );
}
