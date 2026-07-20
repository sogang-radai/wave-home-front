import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { TrashIcon } from '../settings/SettingsUI';
import iotApi from '../../api/iotApi';
import { describeTrigger, describeSchedule, EXEC_MODE_LABELS, TRIGGER_KIND_LABELS } from './iotUtils';
import { AutomationWizard } from './AutomationWizard';

const SECTIONS = [
  { id: 'trigger', title: '자동 감지', match: (rule) => !rule.schedule },
  { id: 'schedule', title: '자동 예약', match: (rule) => !!rule.schedule },
];

function matchesSearch(rule, devices, query) {
  if (!query) return true;
  const triggerDevice = devices.find((d) => d.id === rule.trigger?.deviceId);
  const actionDevice = devices.find((d) => d.id === rule.action?.deviceId);
  const haystack = [
    rule.name,
    rule.actionDeviceName,
    actionDevice?.name,
    rule.action?.name,
    triggerDevice?.name,
    rule.trigger?.kind ? TRIGGER_KIND_LABELS[rule.trigger.kind] : '',
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function AutomationRow({ rule, devices, onOpen, onToggle, onDelete, onExecute }) {
  const triggerDevice = devices.find((d) => d.id === rule.trigger?.deviceId);
  const conditionText = rule.schedule
    ? describeSchedule(rule.schedule)
    : describeTrigger(rule.trigger, { deviceName: triggerDevice?.name });
  const metaText = rule.schedule ? '예약' : (TRIGGER_KIND_LABELS[rule.trigger?.kind] || '감지');

  return (
    <article className="automation-row" onClick={() => onOpen(rule)}>
      <button
        type="button"
        className={`toggle-switch toggle-switch--sm${rule.enabled ? ' on' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle(rule); }}
        aria-label="자동화 활성화"
      >
        <i />
      </button>
      <div className="automation-row-body">
        <strong>{conditionText}</strong>
        <span>{rule.actionDeviceName} · {rule.action.name}</span>
        <em>{metaText} · {EXEC_MODE_LABELS[rule.execMode]}</em>
      </div>
      <div className="automation-row-actions">
        <button type="button" className="settings-btn-ghost automation-row-test" onClick={(e) => { e.stopPropagation(); onExecute(rule); }}>
          테스트 ›
        </button>
        <button type="button" className="icon-btn icon-btn-delete" onClick={(e) => { e.stopPropagation(); onDelete(rule); }} aria-label="삭제" title="삭제">
          <TrashIcon width={15} height={15} />
        </button>
      </div>
    </article>
  );
}

function AutomationSection({ section, rules, devices, onOpen, onToggle, onDelete, onExecute }) {
  return (
    <div className="automation-section">
      <div className="automation-section-head">
        <span>{section.title} <em>({rules.length})</em></span>
      </div>
      <div className="automation-section-body trigger-scroll">
        {rules.length === 0 && <p className="panel-empty">해당하는 자동화가 없습니다.</p>}
        {rules.map((rule) => (
          <AutomationRow
            key={rule.id}
            rule={rule}
            devices={devices}
            onOpen={onOpen}
            onToggle={onToggle}
            onDelete={onDelete}
            onExecute={onExecute}
          />
        ))}
      </div>
    </div>
  );
}

export function TriggerRulesTab() {
  const [devices, setDevices] = useState([]);
  const [rules, setRules] = useState([]);
  const [irCommands, setIrCommands] = useState([]);
  const [search, setSearch] = useState('');
  const [wizardTarget, setWizardTarget] = useState(null); // null | 'new' | rule
  const [toast, setToast] = useState('');

  const load = () => iotApi.getRules().then(setRules);

  useEffect(() => {
    iotApi.getDevices().then(setDevices);
    iotApi.getIrCommands().then(setIrCommands);
    load();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const toggleRule = async (rule) => {
    await iotApi.setRuleEnabled(rule.id, !rule.enabled);
    load();
  };

  const deleteRule = async (rule) => {
    await iotApi.deleteRule(rule.id);
    load();
    showToast(`${rule.schedule ? '자동 예약을' : '자동 감지를'} 삭제했습니다.`);
  };

  const executeRule = async (rule) => {
    const result = await iotApi.executeRuleManually(rule.id);
    showToast(result.skipped ? `쿨다운 중입니다 (${Math.ceil(result.remainingMs / 100) / 10}초 남음)` : '실행했습니다.');
  };

  const filteredBySection = useMemo(() => {
    const q = search.trim();
    return SECTIONS.map((section) => ({
      section,
      rules: rules.filter((r) => section.match(r) && matchesSearch(r, devices, q)),
    }));
  }, [rules, devices, search]);

  const closeWizard = () => setWizardTarget(null);
  const handleSaved = (msg) => {
    showToast(msg);
    load();
    closeWizard();
  };

  return (
    <div className="automation-page">
      <Card
        title="자동화 관리"
        wide
        action={(
          <button type="button" className="card-action-btn" onClick={() => setWizardTarget('new')}>
            + 새 자동화
          </button>
        )}
      >
        <p className="section-description">
          기기 상태·제스처·적외선 신호를 감지하는 <strong className="wave-term">자동 감지</strong>와, 정해진 시각에 실행하는 <strong className="wave-term">자동 예약</strong>을 관리합니다.
        </p>

        <input
          type="search"
          className="automation-search-input"
          placeholder="자동화 검색 (이름, 기기 등)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {rules.length === 0 ? (
          <div className="automation-empty-state">
            <p className="panel-empty">아직 만든 자동화가 없습니다.</p>
            <button type="button" className="settings-btn-primary" onClick={() => setWizardTarget('new')}>+ 새 자동화 만들기</button>
          </div>
        ) : (
          <div className="automation-sections-grid">
            {filteredBySection.map(({ section, rules: sectionRules }) => (
              <AutomationSection
                key={section.id}
                section={section}
                rules={sectionRules}
                devices={devices}
                onOpen={(rule) => setWizardTarget(rule)}
                onToggle={toggleRule}
                onDelete={deleteRule}
                onExecute={executeRule}
              />
            ))}
          </div>
        )}

        {wizardTarget && (
          <AutomationWizard
            devices={devices}
            irCommands={irCommands}
            editingRule={wizardTarget === 'new' ? null : wizardTarget}
            onClose={closeWizard}
            onSaved={handleSaved}
          />
        )}

        {toast && <div className="iot-toast">{toast}</div>}
      </Card>
    </div>
  );
}
