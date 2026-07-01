import { useState } from 'react';
import { Card } from '../../components/ui/Card';

export function AccountSettings({ accounts, accountId, onSwitchAccount, onAddAccount }) {
  const [newMemberName, setNewMemberName] = useState('');

  const addMember = () => {
    if (!newMemberName.trim()) return;
    onAddAccount(newMemberName.trim());
    setNewMemberName('');
  };

  return (
    <Card title="가구 구성원" action={`${accounts.length}명`}>
      <div className="household-list">
        {accounts.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`household-row ${item.id === accountId ? 'active' : ''}`}
            onClick={() => onSwitchAccount(item.id)}
          >
            <span className="mini-avatar">{item.name.charAt(0)}</span>
            <strong>{item.name}</strong>
            {item.id === accountId && <em>현재 사용 중</em>}
          </button>
        ))}
      </div>

      <div className="zone-add-row">
        <input
          type="text"
          placeholder="구성원 이름"
          value={newMemberName}
          onChange={(event) => setNewMemberName(event.target.value)}
        />
        <button type="button" onClick={addMember}>멤버 추가</button>
      </div>
    </Card>
  );
}
