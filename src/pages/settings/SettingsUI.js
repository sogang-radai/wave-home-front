import { useEffect, useRef, useState } from 'react';

const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function GearIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function DragHandleIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 8h16" />
      <path d="M4 12h16" />
      <path d="M4 16h16" />
    </svg>
  );
}

// Page-level wrapper: optional heading + leading description + sections. Sits inside a .card container.
export function SettingsPanel({ heading, description, children }) {
  return (
    <section className="settings-panel card">
      {heading && <h2 className="settings-tab-heading">{heading}</h2>}
      {description && <p className="settings-panel-desc">{description}</p>}
      {children}
    </section>
  );
}

// A titled block. Consecutive sections are divided by a horizontal separator.
export function SettingsSection({ title, action, children }) {
  return (
    <div className="settings-section-block">
      {(title || action) && (
        <div className="settings-section-head">
          {title && <h3>{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function SettingsRow({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-label">
        <strong>{label}</strong>
        {desc && <span>{desc}</span>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  );
}

// Borderless text that becomes editable on focus/click. Commits on blur or Enter.
export function InlineEditableText({ value, onCommit, ariaLabel, className = '' }) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    const next = draft.trim();
    if (next && next !== value) {
      onCommit(next);
    } else {
      setDraft(value);
    }
  };

  return (
    <input
      ref={inputRef}
      className={`inline-edit-input ${className}`}
      type="text"
      value={draft}
      aria-label={ariaLabel}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') inputRef.current?.blur();
        if (event.key === 'Escape') {
          setDraft(value);
          inputRef.current?.blur();
        }
      }}
    />
  );
}

export function SettingsModal({ title, onClose, children, footer }) {
  return (
    <div className="settings-modal-backdrop" onClick={onClose}>
      <section className="settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="settings-modal-head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="settings-modal-body">{children}</div>
        {footer && <div className="settings-modal-footer">{footer}</div>}
      </section>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = '삭제', onConfirm, onCancel }) {
  return (
    <div className="settings-modal-backdrop" onClick={onCancel}>
      <section className="settings-confirm" onClick={(event) => event.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="settings-confirm-actions">
          <button type="button" className="settings-btn-ghost" onClick={onCancel}>취소</button>
          <button type="button" className="settings-btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

// A single-field text prompt modal (account add, room add, etc.).
export function TextPromptModal({ title, label, placeholder, confirmLabel = '추가', onConfirm, onClose }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = () => {
    const next = value.trim();
    if (!next) return;
    onConfirm(next);
  };

  return (
    <SettingsModal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="settings-btn-ghost" onClick={onClose}>취소</button>
          <button type="button" className="settings-btn-primary" onClick={submit} disabled={!value.trim()}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <label className="settings-field">
        {label && <span>{label}</span>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit();
          }}
        />
      </label>
    </SettingsModal>
  );
}
