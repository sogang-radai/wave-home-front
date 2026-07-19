/**
 * ConversationList — shared conversation list body used by both the full
 * chat page sidebar and the popup's conversation panel. Handles pin/rename/
 * delete via a per-row kebab menu (rename-on-title-click was removed).
 */
import { useState, useRef, useEffect } from 'react';

const LS_PINNED = 'chatPinnedIds';

function loadPinned() {
  try { return JSON.parse(localStorage.getItem(LS_PINNED) || '[]'); } catch { return []; }
}
function savePinned(ids) {
  try { localStorage.setItem(LS_PINNED, JSON.stringify(ids)); } catch { /* ignore */ }
}

function PencilWriteIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 17v5" />
      <path d="M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6Z" />
    </svg>
  );
}

function TrashIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function KebabIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

export function ConversationList({ conversations, activeConvId, onSelect, onAdd, onDelete, onRename }) {
  const [pinnedIds, setPinnedIds] = useState(loadPinned);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => savePinned(pinnedIds), [pinnedIds]);

  useEffect(() => {
    if (!menuOpenId) return undefined;
    const onDocPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setMenuOpenId(null);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [menuOpenId]);

  const togglePin = (id) => {
    setPinnedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const startEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setMenuOpenId(null);
  };

  const saveEdit = () => {
    if (editTitle.trim()) onRename(editingId, editTitle.trim());
    setEditingId(null);
  };

  // Stable sort — pinned conversations float to the top, otherwise the
  // incoming (recency) order from the API is preserved.
  const ordered = [...conversations].sort((a, b) => {
    const ap = pinnedIds.includes(a.id);
    const bp = pinnedIds.includes(b.id);
    if (ap === bp) return 0;
    return ap ? -1 : 1;
  });

  return (
    <div className="conv-list-root" ref={rootRef}>
      <button className="conv-new-row" onClick={onAdd}>
        <PencilWriteIcon />
        <span>새 대화</span>
      </button>
      <hr className="conv-separator" />

      <div className="conv-scroll">
        {ordered.length === 0 && (
          <p className="conv-empty">대화 내역이 없습니다</p>
        )}
        {ordered.map((conv) => {
          const isEditing = editingId === conv.id;
          const isPinned = pinnedIds.includes(conv.id);
          const menuOpen = menuOpenId === conv.id;
          return (
            <div
              key={conv.id}
              className={`conv-item${conv.id === activeConvId ? ' active' : ''}${menuOpen ? ' menu-open' : ''}`}
              onClick={() => !isEditing && onSelect(conv.id)}
            >
              {isEditing ? (
                <input
                  className="conv-edit-input"
                  value={editTitle}
                  size={Math.max(1, editTitle.length)}
                  autoFocus
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="conv-title">
                  {isPinned && <PinIcon className="conv-pin-mark" />}
                  <span className="conv-title-text">{conv.title}</span>
                </span>
              )}

              {!isEditing && (
                <div className="conv-actions">
                  <button
                    className="conv-kebab-btn"
                    title="더보기"
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpen ? null : conv.id); }}
                  >
                    <KebabIcon />
                  </button>
                  {menuOpen && (
                    <div className="conv-menu" onClick={(e) => e.stopPropagation()}>
                      <button className="conv-menu-item" onClick={() => startEdit(conv)}>
                        <PencilWriteIcon /> 이름 변경
                      </button>
                      <button className="conv-menu-item" onClick={() => { togglePin(conv.id); setMenuOpenId(null); }}>
                        <PinIcon /> {isPinned ? '고정 해제' : '상단 고정'}
                      </button>
                      <button className="conv-menu-item danger" onClick={() => { onDelete(conv.id); setMenuOpenId(null); }}>
                        <TrashIcon /> 제거
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
