import { useEffect, useRef, useState } from 'react';
import settingsApi from '../../api/settingsApi';
import { SettingsPanel, SettingsSection, SettingsRow } from './SettingsUI';
import iconGemini from '../../img/logo/icon_gemini.png';
import iconGemma from '../../img/logo/icon_gemma.png';
import iconOpenAI from '../../img/logo/icon_openai.png';
import iconNomic from '../../img/logo/icon_nomic.png';

const PROMPT_LIMIT = 1000;

// Map model id/name/vendor to a vendor icon image.
function getVendorIcon(model) {
  const name = model.name.toLowerCase();
  const id = model.id.toLowerCase();
  if (name.startsWith('gemma') || id.startsWith('gemma')) return iconGemma;
  if (name.startsWith('gemini') || id.startsWith('gemini')) return iconGemini;
  if (model.vendor === 'openai' || name.startsWith('gpt') || id.startsWith('gpt')) return iconOpenAI;
  if (model.vendor === 'nomic') return iconNomic;
  return null;
}

function maskKey(key) {
  if (!key) return null;
  if (key.length <= 12) return key;
  return `${key.slice(0, 8)}${'•'.repeat(8)}${key.slice(-4)}`;
}

export function AiAgentSettings({ heading }) {
  const [settings, setSettings] = useState(null);
  const [models, setModels] = useState([]);
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    Promise.all([settingsApi.getAiAgentSettings(), settingsApi.getAiModels()])
      .then(([cfg, mdls]) => {
        setSettings(cfg);
        setPrompt(cfg.personalPrompt);
        setModels(mdls);
      });
  }, []);

  // Sync textarea height after initial load.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el || !settings) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  }, [settings]);

  const savePrompt = async () => {
    if (!settings || prompt === settings.personalPrompt) return;
    const saved = await settingsApi.updateAiAgentSettings({ personalPrompt: prompt });
    setSettings(saved);
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
    const el = event.target;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 120)}px`;
  };

  // Optimistic selection: update UI immediately, then sync with API response.
  const selectModel = (modelId) => {
    setSettings((current) => (current ? { ...current, selectedModelId: modelId } : current));
    settingsApi.updateAiAgentSettings({ selectedModelId: modelId })
      .then(setSettings)
      .catch(() => {
        // Revert to server state on API failure.
        settingsApi.getAiAgentSettings().then(setSettings);
      });
  };

  const patchSettings = (patch) => {
    setSettings((current) => (current ? { ...current, ...patch } : current));
    settingsApi.updateAiAgentSettings(patch).then(setSettings).catch(() => {
      settingsApi.getAiAgentSettings().then(setSettings);
    });
  };

  if (!settings) {
    return <SettingsPanel heading={heading} description="AI 에이전트가 사용할 개인 프롬프트와 모델을 설정합니다." />;
  }

  const selectedModel = models.find((model) => model.id === settings.selectedModelId) || null;

  return (
    <SettingsPanel heading={heading} description="AI 에이전트가 사용할 개인 프롬프트와 모델을 설정합니다.">
      <SettingsSection title="개인 프롬프트">
        <div className="prompt-field">
          <textarea
            ref={textareaRef}
            className="prompt-textarea"
            value={prompt}
            maxLength={PROMPT_LIMIT}
            placeholder="에이전트가 항상 참고할 나에 대한 정보나 말투를 적어주세요."
            onChange={handlePromptChange}
            onBlur={savePrompt}
          />
          <span className="prompt-counter">{prompt.length}/{PROMPT_LIMIT}</span>
        </div>
      </SettingsSection>

      <SettingsSection
        title="AI 모델"
        action={
          // Dummy: model-add flow is not yet implemented.
          <button type="button" className="settings-add-btn" title="준비 중">모델 추가</button>
        }
      >
        <div className="ai-model-list">
          {models.map((model) => {
            const icon = getVendorIcon(model);
            return (
              <button
                type="button"
                key={model.id}
                className={`ai-model-row ${settings.selectedModelId === model.id ? 'selected' : ''}`}
                onClick={() => selectModel(model.id)}
              >
                <div className="ai-model-name">
                  <div className="ai-model-id">
                    {icon
                      ? <img className="ai-vendor-icon" src={icon} alt={model.vendor} />
                      : <span className="ai-model-vendor">{model.vendor}</span>
                    }
                    <strong className="ai-model-model">{model.name}</strong>
                  </div>
                  <div className="ai-model-tags">
                    {model.local && <span className="ai-model-tag">로컬</span>}
                    {model.embedding && <span className="ai-model-tag embedding">임베딩</span>}
                  </div>
                </div>
                <span className="ai-model-provider">{model.provider}</span>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      {selectedModel && (
        <SettingsSection title="모델 정보">
          <div className="device-detail-grid">
            <div className="device-detail-line">
              <span>제공자</span>
              <strong>{selectedModel.provider}</strong>
            </div>
            <div className="device-detail-line">
              <span>벤더</span>
              <strong>{selectedModel.vendor}</strong>
            </div>
            <div className="device-detail-line">
              <span>모델명</span>
              <strong>{selectedModel.name}</strong>
            </div>
            <div className="device-detail-line">
              <span>API endpoint</span>
              <strong>{selectedModel.endpoint}</strong>
            </div>
            <div className="device-detail-line">
              <span>API key</span>
              <strong>{maskKey(selectedModel.apiKey) || '불필요 (로컬)'}</strong>
            </div>
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="채팅 설정">
        <SettingsRow label="Ctrl + Enter 전송" desc="Ctrl+Enter로 메시지를 전송합니다.">
          <button
            type="button"
            className={`toggle-switch ${settings.ctrlEnterSend ? 'on' : ''}`}
            onClick={() => patchSettings({ ctrlEnterSend: !settings.ctrlEnterSend })}
            aria-label="Ctrl+Enter 전송 토글"
          >
            <i />
          </button>
        </SettingsRow>
        <SettingsRow label="WaveAI 효과음" desc="채팅을 열 때 보글보글 효과음을 재생합니다.">
          <button
            type="button"
            className={`toggle-switch ${settings.waveAiSound ? 'on' : ''}`}
            onClick={() => patchSettings({ waveAiSound: !settings.waveAiSound })}
            aria-label="WaveAI 효과음 토글"
          >
            <i />
          </button>
        </SettingsRow>
      </SettingsSection>
    </SettingsPanel>
  );
}
