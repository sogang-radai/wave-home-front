import { useState } from 'react';
import {
  SettingsPanel,
  SettingsSection,
  InlineEditableText,
  TextPromptModal,
  PlusIcon,
} from './SettingsUI';

export function AccountSettings({ heading, accounts, accountId, account, onSwitchAccount, onRenameAccount, onAddAccount }) {
  const [addOpen, setAddOpen] = useState(false);

  const addAccount = (name) => {
    onAddAccount(name);
    setAddOpen(false);
  };

  return (
    <SettingsPanel heading={heading} description="가구 구성원을 추가하고 현재 사용 중인 프로필을 편집합니다.">
      <SettingsSection
        title="구성원"
        action={
          <button type="button" className="settings-add-btn" onClick={() => setAddOpen(true)}>
            <PlusIcon width={16} height={16} />
            계정 추가
          </button>
        }
      >
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
      </SettingsSection>

      <SettingsSection title="프로필 편집">
        <div className="account-profile">
          <div className="account-profile-avatar">
            {account.name.charAt(0)}
            {/* Dummy: avatar image upload is not yet supported. */}
            <button type="button" className="account-avatar-edit" title="사진 변경 (준비 중)" aria-label="사진 변경">
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden="true">
                <path d="M9 5v15M1 12h15" />
              </svg>
            </button>
          </div>
          <label className="account-profile-name">
            <span>이름</span>
            <InlineEditableText
              key={account.id}
              value={account.name}
              ariaLabel="내 이름"
              onCommit={(name) => onRenameAccount(account.id, name)}
            />
          </label>
        </div>
      </SettingsSection>

      {addOpen && (
        <TextPromptModal
          title="계정 추가"
          label="구성원 이름"
          placeholder="예: 김건강"
          confirmLabel="추가"
          onConfirm={addAccount}
          onClose={() => setAddOpen(false)}
        />
      )}
    </SettingsPanel>
  );
}
