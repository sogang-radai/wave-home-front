import { useEffect, useState } from 'react';
import settingsApi from '../../../api/settingsApi';
import iotApi from '../../../api/iotApi';
import { SendIcon } from '../icons';

// Shared TTS composer used by both CameraPanel and WaveStationPanel — any
// device with a speaker can play a one-off announcement through this.
export function TtsPanel({ deviceId }) {
  const [speakers, setSpeakers] = useState([]);
  const [speakerId, setSpeakerId] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    settingsApi.getTtsSpeakers().then((list) => {
      setSpeakers(list);
      if (list.length > 0) setSpeakerId(list[0].id);
    });
  }, []);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setToast('');
    try {
      await iotApi.sendTts(deviceId, { text: text.trim(), speakerId });
      setText('');
      setToast('전송했습니다 (재생 중)');
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setToast(err?.message || '전송에 실패했습니다');
      setTimeout(() => setToast(''), 2500);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className="tts-panel">
      <span className="tts-panel-label">TTS 메시지</span>
      <textarea
        className="tts-panel-textarea"
        rows={3}
        placeholder="장치에서 재생할 메시지를 입력하세요 (Enter 전송, Shift+Enter 줄바꿈)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
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
      {toast && <span className="tts-panel-toast">{toast}</span>}
    </div>
  );
}
