import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import settingsApi from '../../../api/settingsApi';
import iotApi from '../../../api/iotApi';
import { SendIcon } from '../icons';

const TTS_MIN_ROWS = 3;

function autoGrowTextarea(el, minRows) {
  if (!el) return;
  const styles = window.getComputedStyle(el);
  const lineHeight = parseFloat(styles.lineHeight) || 20;
  const pad = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
  const minHeight = lineHeight * minRows + pad;
  el.style.height = 'auto';
  el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
}

// Shared TTS composer used by both CameraPanel and WaveStationPanel — any
// device with a speaker can play a one-off announcement through this.
export function TtsPanel({ deviceId }) {
  const [speakers, setSpeakers] = useState([]);
  const [speakerId, setSpeakerId] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');
  const textareaRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    settingsApi.getTtsSpeakers().then((list) => {
      setSpeakers(list);
      if (list.length > 0) setSpeakerId(list[0].id);
    });
    return () => clearTimeout(toastTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    autoGrowTextarea(textareaRef.current, TTS_MIN_ROWS);
  }, [text]);

  const showToast = (message) => {
    clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  };

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await iotApi.sendTts(deviceId, { text: text.trim(), speakerId });
      setText('');
      showToast('전송했습니다 (재생 중)');
    } catch (err) {
      showToast(err?.message || '전송에 실패했습니다');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="tts-panel">
      <span className="tts-panel-label">TTS 메시지</span>
      <div className="tts-panel-field">
        <textarea
          ref={textareaRef}
          className={`tts-panel-textarea${toast ? ' has-toast' : ''}`}
          rows={TTS_MIN_ROWS}
          placeholder="장치에서 재생할 메시지를 입력하세요 (Ctrl/⌘+Enter 전송)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {toast && (
          <span className={`tts-panel-toast ${toast.includes('실패') ? 'is-error' : ''}`} role="status">
            {toast}
          </span>
        )}
      </div>
      <div className="tts-panel-controls">
        <select
          className="settings-select tts-panel-voice"
          value={speakerId}
          onChange={(e) => setSpeakerId(Number(e.target.value))}
        >
          {speakers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <button type="button" className="tts-panel-send" disabled={!text.trim() || sending} onClick={send}>
          <SendIcon width={15} height={15} />
          전송
        </button>
      </div>
    </div>
  );
}
