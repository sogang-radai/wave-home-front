import { useState } from 'react';
import { Card } from '../../components/ui/Card';

export function PersonalSettings({ account, onRenameAccount }) {
  const [name, setName] = useState(account.name);
  const dirty = name.trim().length > 0 && name.trim() !== account.name;

  const save = () => {
    if (!dirty) return;
    onRenameAccount(account.id, name.trim());
  };

  return (
    <Card title="개인 설정">
      <div className="personal-profile-panel">
        <div className="personal-profile-avatar">{account.name.charAt(0)}</div>
        <input
          type="text"
          className="personal-profile-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <button type="button" className="personal-profile-save" disabled={!dirty} onClick={save}>
          저장
        </button>
      </div>
    </Card>
  );
}
