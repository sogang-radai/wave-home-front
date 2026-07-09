import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessages } from './ChatMessages';
import { ConversationList } from './ConversationList';
import './chat.css';

const POPUP_MIN_W = 280;
const POPUP_MIN_H = 300;
const POPUP_MAX_W = 680;
const POPUP_MAX_H = 760;
const MINI_MIN_W = 200;
const MINI_MAX_W = 600;
const MINI_H = 48;
const SNAP_MARGIN = 20;
const TOPBAR_H = 64; // .topbar height in layout.css — popup/mini must never cover it
const TOP_MIN = TOPBAR_H + SNAP_MARGIN;
const DRAG_THRESHOLD = 3;

const STORAGE_KEY_CORNER = 'chatPopupCorner';
const STORAGE_KEY_SIZE = 'chatPopupSize';

function loadStoredCorner() {
  try {
    const v = localStorage.getItem(STORAGE_KEY_CORNER);
    if (!v) return null;
    const parsed = JSON.parse(v);
    if (parsed?.h && parsed?.v) return parsed;
    return null;
  } catch { return null; }
}
function loadStoredSize() {
  try { const v = localStorage.getItem(STORAGE_KEY_SIZE); return v ? JSON.parse(v) : null; } catch { return null; }
}
function saveCorner(c) { try { localStorage.setItem(STORAGE_KEY_CORNER, JSON.stringify(c)); } catch {} }
function saveSize(s) { try { localStorage.setItem(STORAGE_KEY_SIZE, JSON.stringify(s)); } catch {} }

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

// Position is always derived from {h, v} + current size + viewport + sidebar
// width — never stored as raw pixels. This is what makes the popup track the
// sidebar collapsing/expanding and window resizes without any special-cased
// "shift" logic (and without the bounce that caused).
function computeCornerPos(corner, w, h, sidebarWidth) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const leftMin = sidebarWidth + SNAP_MARGIN;
  const leftMax = Math.max(leftMin, vw - SNAP_MARGIN - w);
  const topMax = Math.max(TOP_MIN, vh - SNAP_MARGIN - h);
  return {
    left: corner.h === 'left' ? leftMin : leftMax,
    top: corner.v === 'top' ? TOP_MIN : topMax,
  };
}

// Which corner direction is nearest to a given rect center (respecting the
// sidebar/topbar exclusion zones).
function nearestCornerDirection(centerX, centerY, sidebarWidth) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const midX = (sidebarWidth + vw) / 2;
  const midY = (TOP_MIN + vh) / 2;
  return {
    h: centerX < midX ? 'left' : 'right',
    v: centerY < midY ? 'top' : 'bottom',
  };
}

function PopupConvPanel({ conversations, activeConvId, onSelectConv, onAddConv, onDeleteConv, onRenameConv, onClose }) {
  return (
    <div className="chat-popup-conv-panel">
      <ConversationList
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={(id) => { onSelectConv(id); onClose(); }}
        onAdd={() => { onAddConv(); onClose(); }}
        onDelete={onDeleteConv}
        onRename={onRenameConv}
      />
    </div>
  );
}

export function ChatPopup({
  mode,
  conversations,
  activeConvId,
  onSelectConv,
  onAddConv,
  onDeleteConv,
  onRenameConv,
  onSendMessage,
  onExpand,
  onMini,
  onClose,
  sidebarWidth = 263,
  forceTopRight = false,
  onForceTopRightConsumed,
}) {
  const popupRef = useRef(null);
  const [showConvList, setShowConvList] = useState(false);

  // Size state (raw w/h — independent of which corner we're snapped to)
  const [size, setSize] = useState(() => loadStoredSize() || { w: 380, h: 520 });

  // Which corner the popup is docked to — the only thing we persist for
  // position. Actual pixel position is always derived from this + size.
  const [corner, setCorner] = useState(() => (
    forceTopRight ? { h: 'right', v: 'top' } : (loadStoredCorner() || { h: 'right', v: 'bottom' })
  ));

  // Transient exact position while actively dragging/resizing. Null once the
  // gesture ends and we fall back to the corner-derived position.
  const [dragPos, setDragPos] = useState(null);

  // True right after a drag/resize snap-confirm, so the CSS transition uses
  // the springy "snap" easing instead of the plain mode-change easing.
  const [snapping, setSnapping] = useState(false);
  // True only while the pointer is actively dragging/resizing — disables CSS
  // transitions so the popup tracks the cursor with zero lag.
  const [interacting, setInteracting] = useState(false);
  // Set to true during a header drag that actually moved the popup; used to
  // suppress the click-to-toggle-mini handler firing right after a drag.
  const didDragRef = useRef(false);

  const isMini = mode === 'mini';
  const currentW = isMini ? clamp(size.w, MINI_MIN_W, MINI_MAX_W) : size.w;
  const currentH = isMini ? MINI_H : size.h;

  useEffect(() => { saveCorner(corner); }, [corner]);

  // Notify the parent once we've consumed the one-shot force-top-right flag.
  useEffect(() => {
    if (forceTopRight) onForceTopRightConsumed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render on viewport resize so the corner-derived position recalculates.
  useEffect(() => {
    const onResize = () => setCorner((c) => ({ ...c }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const confirmSnap = useCallback((rect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setCorner(nearestCornerDirection(cx, cy, sidebarWidth));
    setDragPos(null);
    setSnapping(true);
    setTimeout(() => setSnapping(false), 380);
  }, [sidebarWidth]);

  // ── Header drag (move) ───────────────────────────────────────────────────
  const handleHeaderPointerDown = useCallback((e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = rect.left;
    const startTop = rect.top;
    didDragRef.current = false;
    setInteracting(true);
    setSnapping(false);

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) didDragRef.current = true;
      const nextTop = Math.max(TOP_MIN, startTop + dy);
      setDragPos({ left: startLeft + dx, top: nextTop });
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setInteracting(false);
      if (didDragRef.current) {
        const el2 = popupRef.current;
        if (el2) confirmSnap(el2.getBoundingClientRect());
      } else {
        setDragPos(null);
      }
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [confirmSnap]);

  // Suppress the mini-mode label click right after a drag ends
  const handleMiniLabelClick = useCallback(() => {
    if (didDragRef.current) return;
    onMini();
  }, [onMini]);

  // ── Resize drag ──────────────────────────────────────────────────────────
  const handleResizePointerDown = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    const el = popupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;
    const startLeft = rect.left;
    const startTop = rect.top;
    setInteracting(true);
    setSnapping(false);

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      let newW = startW;
      let newH = startH;
      let newLeft = startLeft;
      let newTop = startTop;

      if (isMini) {
        // Mini: horizontal resize only
        if (dir.includes('e')) newW = clamp(startW + dx, MINI_MIN_W, MINI_MAX_W);
        if (dir.includes('w')) {
          newW = clamp(startW - dx, MINI_MIN_W, MINI_MAX_W);
          newLeft = startLeft + (startW - newW);
        }
      } else {
        if (dir.includes('e')) newW = clamp(startW + dx, POPUP_MIN_W, POPUP_MAX_W);
        if (dir.includes('w')) {
          newW = clamp(startW - dx, POPUP_MIN_W, POPUP_MAX_W);
          newLeft = startLeft + (startW - newW);
        }
        if (dir.includes('s')) newH = clamp(startH + dy, POPUP_MIN_H, POPUP_MAX_H);
        if (dir.includes('n')) {
          newH = clamp(startH - dy, POPUP_MIN_H, POPUP_MAX_H);
          newTop = startTop + (startH - newH);
        }
      }
      newTop = Math.max(TOP_MIN, newTop);

      setSize((prev) => ({ w: newW, h: isMini ? prev.h : newH }));
      setDragPos({ left: newLeft, top: newTop });
    };

    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      setInteracting(false);
      const el2 = popupRef.current;
      if (el2) {
        const finalRect = el2.getBoundingClientRect();
        // In mini mode the rendered height is always MINI_H — preserve the
        // stored popup-mode height rather than overwriting it with that.
        saveSize({ w: finalRect.width, h: isMini ? size.h : finalRect.height });
        confirmSnap(finalRect);
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [isMini, confirmSnap, size.h]);

  // ── Popup style ──────────────────────────────────────────────────────────
  const cornerPos = computeCornerPos(corner, currentW, currentH, sidebarWidth);
  const pos = dragPos || cornerPos;

  const snapTransition = 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.28s ease, height 0.28s ease';
  const modeTransition = 'width 0.28s ease, height 0.28s ease, left 0.28s ease, top 0.28s ease';
  // While interacting, disable all transitions so the popup tracks the cursor immediately.
  const transitionValue = interacting ? 'none' : (snapping ? snapTransition : modeTransition);

  const popupStyle = {
    left: pos.left,
    top: pos.top,
    right: 'auto',
    bottom: 'auto',
    width: currentW,
    height: currentH,
    transition: transitionValue,
  };

  // ── Active conversation data ──────────────────────────────────────────────
  const activeConv = conversations.find((c) => c.id === activeConvId) || null;
  const messages = activeConv?.messages || [];
  const isNewChat = !activeConvId;

  // ── 8-direction resize handles ───────────────────────────────────────────
  const HANDLES = [
    ['n', 'n-resize'],
    ['ne', 'ne-resize'],
    ['e', 'e-resize'],
    ['se', 'se-resize'],
    ['s', 's-resize'],
    ['sw', 'sw-resize'],
    ['w', 'w-resize'],
    ['nw', 'nw-resize'],
  ];
  const activeHandles = isMini
    ? HANDLES.filter(([d]) => d === 'w' || d === 'e')
    : HANDLES;

  const topbarLeft = (
    <div
      className="chat-popup-header-left"
      style={isMini ? { cursor: 'pointer', flex: 1 } : {}}
      onClick={isMini ? handleMiniLabelClick : undefined}
    >
      <span className="chat-popup-icon">✦</span>
      <span className={isMini ? 'chat-popup-mini-label' : 'chat-popup-conv-label'}>
        {activeConv ? activeConv.title : 'WaveAI'}
      </span>
    </div>
  );

  const topbarRight = (
    <>
      {!isMini && (
        <button
          className={`chat-popup-action-btn${showConvList ? ' active' : ''}`}
          onClick={() => setShowConvList((v) => !v)}
          title="대화 목록"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
      <button className="chat-popup-action-btn" onClick={onMini} title={isMini ? '팝업으로 열기' : '한 줄로 접기'}>
        {isMini ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </button>
      <button className="chat-popup-action-btn" onClick={onExpand} title="전체 화면으로 열기">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      </button>
      <button className="chat-popup-action-btn" onClick={onClose} title="닫기">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </>
  );

  return (
    <div ref={popupRef} className={`chat-popup chat-popup--${mode}`} style={popupStyle}>
      {/* 8-direction resize handles */}
      {activeHandles.map(([dir, cur]) => (
        <div
          key={dir}
          className={`chat-popup-rh chat-popup-rh--${dir}`}
          style={{ cursor: cur }}
          onPointerDown={(e) => handleResizePointerDown(e, dir)}
        />
      ))}

      {/* Header — drag to move */}
      <div
        className="chat-popup-header"
        onPointerDown={handleHeaderPointerDown}
        style={{ cursor: 'grab', userSelect: 'none' }}
      >
        {topbarLeft}
        <div className="chat-popup-header-actions" onClick={(e) => e.stopPropagation()}>
          {topbarRight}
        </div>
      </div>

      {/* Body — only when popup mode */}
      {!isMini && (
        showConvList ? (
          <PopupConvPanel
            conversations={conversations}
            activeConvId={activeConvId}
            onSelectConv={onSelectConv}
            onAddConv={onAddConv}
            onDeleteConv={onDeleteConv}
            onRenameConv={onRenameConv}
            onClose={() => setShowConvList(false)}
          />
        ) : (
          <ChatMessages
            messages={messages}
            isNewChat={isNewChat}
            chatEntered={true}
            onSend={onSendMessage}
            compact={true}
          />
        )
      )}
    </div>
  );
}
