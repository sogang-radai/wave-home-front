import { useEffect, useState } from 'react';
import chatApi from '../../api/chatApi';
import './chat.css';

export function InsightChat({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '안녕하세요! WaveHome AI예요. 오늘의 수면, 자세, 심박 데이터에 대해 무엇이든 물어보세요.' },
  ]);
  const [draft, setDraft] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    chatApi.getSuggestions().then((res) => setSuggestions(res.insightSuggestions));
  }, []);

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setDraft('');
    const { reply } = await chatApi.askInsight(trimmed);
    setMessages((current) => [...current, { role: 'assistant', text: reply }]);
  };

  return (
    <aside className={`insight-chat ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="insight-chat-inner">
        <div className="insight-chat-head">
          <div className="insight-chat-brand">
            <span className="insight-chat-spark">✦</span>
            <strong>WaveAI</strong>
          </div>
          <button type="button" className="insight-chat-close" aria-label="채팅 닫기" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="insight-chat-body">
          {messages.map((message, index) => (
            <div className={`insight-chat-bubble ${message.role}`} key={index}>
              {message.text}
            </div>
          ))}
        </div>

        <div className="insight-chat-suggestions">
          <p>이런 질문도 해보세요</p>
          <div className="insight-chat-chip-list">
            {suggestions.map((suggestion) => (
              <button type="button" key={suggestion.id || suggestion.prompt} onClick={() => sendMessage(suggestion.prompt)}>
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        <form
          className="insight-chat-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(draft);
          }}
        >
          <input
            type="text"
            placeholder="인사이트를 물어보세요"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit" aria-label="보내기">↑</button>
        </form>
      </div>
    </aside>
  );
}
