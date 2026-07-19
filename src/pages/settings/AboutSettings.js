import { useRef } from 'react';
import { SettingsPanel, SettingsSection } from './SettingsUI';

// Frontend open-source libraries from package.json dependencies / devDependencies.
const frontendLibraries = [
  { name: 'React', version: '19.2.7', license: 'MIT' },
  { name: 'React DOM', version: '19.2.7', license: 'MIT' },
  { name: 'Recharts', version: '3.9.0', license: 'MIT' },
  { name: '@iconify/react', version: '6.0.2', license: 'MIT' },
  { name: 'three', version: '0.185.1', license: 'MIT' },
  { name: '@react-three/fiber', version: '9.6.1', license: 'MIT' },
  { name: '@react-three/drei', version: '10.7.7', license: 'MIT' },
  { name: 'framer-motion', version: '12.42.2', license: 'MIT' },
  { name: 'GSAP', version: '3.15.0', license: 'GSAP Standard' },
  { name: '@gsap/react', version: '2.1.2', license: 'GSAP Standard' },
  { name: 'Lenis', version: '1.3.25', license: 'MIT' },
  { name: 'lucide-react', version: '1.24.0', license: 'ISC' },
  { name: 'web-vitals', version: '2.1.4', license: 'Apache-2.0' },
  { name: 'react-scripts (CRA)', version: '5.0.1', license: 'MIT' },
  { name: 'Tailwind CSS', version: '3.4.19', license: 'MIT' },
  { name: 'PostCSS', version: '8.5.15', license: 'MIT' },
  { name: 'Autoprefixer', version: '10.5.2', license: 'MIT' },
  { name: 'Testing Library', version: '16.3.2', license: 'MIT' },
];

// Server-side (C++ / Drogon) third-party library list.
const serverLibraries = [
  { name: 'Drogon', version: '1.9.13', license: 'MIT' },
  { name: 'Trantor', version: '1.5.28', license: 'BSD-3-Clause' },
  { name: 'SQLite', version: '3.x', license: 'Public Domain' },
  { name: 'sqlite-vec', version: '0.1.9', license: 'MIT' },
  { name: 'JsonCpp', version: '1.9.6', license: 'MIT' },
  { name: 'nlohmann/json', version: '3.12.0', license: 'MIT' },
  { name: 'Boost.Asio', version: '1.86.0', license: 'BSL-1.0' },
  { name: 'OpenSSL', version: '3.x', license: 'Apache-2.0' },
  { name: 'zlib', version: '1.3.x', license: 'zlib' },
  { name: 'ncnn', version: '2024.x', license: 'BSD-3-Clause' },
  { name: 'sherpa-onnx', version: '1.13.3', license: 'Apache-2.0' },
  { name: 'ONNX Runtime', version: '1.22.x', license: 'MIT' },
  { name: 'KissFFT', version: '131.1.0', license: 'BSD-3-Clause' },
  { name: 'espeak-ng', version: '1.51.x', license: 'GPL-3.0' },
  { name: 'Eigen', version: '3.4.x', license: 'MPL-2.0' },
  { name: 'piper-phonemize', version: '1.2.x', license: 'MIT' },
  { name: 'kaldi-native-fbank', version: '1.21.x', license: 'Apache-2.0' },
  { name: 'kaldifst', version: '1.7.x', license: 'Apache-2.0' },
  { name: 'go2rtc', version: '1.9.x', license: 'MIT' },
  { name: 'libopus', version: '1.5.x', license: 'BSD-3-Clause' },
];

// Agent server (Python) libraries from wave-home-agent/requirements.txt.
const agentLibraries = [
  { name: 'FastAPI', version: '0.115+', license: 'MIT' },
  { name: 'Uvicorn', version: '0.30+', license: 'BSD-3-Clause' },
  { name: 'Pydantic', version: '2.8+', license: 'MIT' },
  { name: 'pydantic-settings', version: '2.4+', license: 'MIT' },
  { name: 'httpx', version: '0.27+', license: 'BSD-3-Clause' },
  { name: 'LangGraph', version: '1.0+', license: 'MIT' },
  { name: 'LangChain Core', version: '1.4+', license: 'MIT' },
  { name: 'langchain-google-genai', version: '3.1+', license: 'MIT' },
  { name: 'langchain-openai', version: '1.0+', license: 'MIT' },
  { name: 'python-dotenv', version: '1.0+', license: 'BSD-3-Clause' },
  { name: 'urllib3', version: '1.26+', license: 'MIT' },
];

const termsOfService = [
  '본 약관은 WaveHome 서비스(이하 "서비스")의 이용 조건과 절차, 이용자와 제공자의 권리·의무 및 책임 사항을 규정합니다.',
  '이용자는 서비스를 통해 제공되는 가정 내 장치 제어 및 건강 관리 기능을 개인적·비상업적 목적으로 이용할 수 있습니다.',
  '이용자는 관계 법령과 본 약관을 준수해야 하며, 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.',
  '제공자는 안정적인 서비스 제공을 위해 노력하나, 천재지변·설비 장애 등 불가항력적 사유로 서비스가 일시 중단될 수 있습니다.',
  '본 약관에 명시되지 않은 사항은 관계 법령 및 상관례에 따릅니다.',
];

const privacyPolicy = [
  'WaveHome은 서비스 제공에 필요한 최소한의 개인정보(구성원 이름, 장치·구역 설정, 건강 관련 측정값)를 수집합니다.',
  '수집한 정보는 장치 제어, 수면·자세 분석, 개인 맞춤 안내 제공의 목적으로만 이용됩니다.',
  '개인정보는 원칙적으로 가정 내 기기 및 서버에서 처리되며, 이용자의 동의 없이 제3자에게 제공되지 않습니다.',
  '이용자는 언제든지 본인의 개인정보에 대한 열람·정정·삭제를 요청할 수 있습니다.',
  '개인정보는 이용 목적이 달성되거나 이용자가 삭제를 요청한 경우 지체 없이 파기됩니다.',
];

export function AboutSettings({ heading, onUnlockDevMenu }) {
  // Five rapid clicks on the Software card unlocks developer settings.
  // Intentionally looks non-interactive (default cursor, no hover affordance).
  const devClickRef = useRef({ count: 0, last: 0 });

  const handleSoftwareCardClick = () => {
    if (!onUnlockDevMenu) return;
    const now = Date.now();
    const state = devClickRef.current;
    state.count = now - state.last < 400 ? state.count + 1 : 1;
    state.last = now;
    if (state.count >= 5) {
      state.count = 0;
      onUnlockDevMenu();
    }
  };

  return (
    <SettingsPanel heading={heading} description="소프트웨어 정보와 이용약관, 오픈소스 라이선스를 확인합니다.">
      <SettingsSection title="소프트웨어">
        <div className="device-detail-grid">
          <div
            className="device-detail-line about-dev-unlock"
            onClick={handleSoftwareCardClick}
          >
            <span>소프트웨어</span>
            <strong>WaveHome</strong>
          </div>
          <div className="device-detail-line">
            <span>제작</span>
            <strong>Sogang-RADAI</strong>
          </div>
          <div className="device-detail-line">
            <span>버전</span>
            <strong>0.1.0</strong>
          </div>
          <div className="device-detail-line">
            <span>빌드 날짜</span>
            <strong>2026-07-06</strong>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="약관 및 정책">
        <details className="about-legal-section">
          <summary>서비스 이용약관</summary>
          <ol>
            {termsOfService.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </details>
        <details className="about-legal-section">
          <summary>개인정보 처리방침</summary>
          <ol>
            {privacyPolicy.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </details>
      </SettingsSection>

      <SettingsSection title="오픈소스 라이선스 (프론트엔드)">
        <div className="about-oss-list">
          {frontendLibraries.map((lib) => (
            <div className="about-oss-row" key={lib.name}>
              <strong>{lib.name}</strong>
              <span>v{lib.version} · {lib.license}</span>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="오픈소스 라이선스 (백엔드 서버)">
        <div className="about-oss-list">
          {serverLibraries.map((lib) => (
            <div className="about-oss-row" key={lib.name}>
              <strong>{lib.name}</strong>
              <span>v{lib.version} · {lib.license}</span>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="오픈소스 라이선스 (에이전트 서버)">
        <div className="about-oss-list">
          {agentLibraries.map((lib) => (
            <div className="about-oss-row" key={lib.name}>
              <strong>{lib.name}</strong>
              <span>v{lib.version} · {lib.license}</span>
            </div>
          ))}
        </div>
      </SettingsSection>
    </SettingsPanel>
  );
}
