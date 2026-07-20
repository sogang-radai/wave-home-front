import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PAD = 8; // 하이라이트 여백
const GAP = 14; // 툴팁과 대상 사이 간격
const TIP_W = 320;

function padRect(r) {
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

export function CoachMarks({ steps, active, onClose, onFinish, onDontShowAgain, onStepChange }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [extraRect, setExtraRect] = useState(null);
  const [tip, setTip] = useState({ top: 0, left: 0 });
  const tipRef = useRef(null);

  const step = active ? steps[stepIndex] : null;
  const isFirst = stepIndex === 0;
  const isLast = !!step && stepIndex === steps.length - 1;

  useEffect(() => {
    if (active) setStepIndex(0);
  }, [active]);

  // Lets the parent open the mobile nav drawer while a sidebar-anchored step
  // is showing (those targets sit off-screen behind `.sidebar` until it's
  // open) and close it again for dashboard-card steps or once the tour ends.
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  // 대상 위치 측정 + 툴팁 배치. 사이드바 스텝은 anchorSelector(사이드바 컨테이너)의
  // 가장자리를 기준으로 좌우 위치를 잡아, 메뉴 버튼 안쪽 여백 때문에 툴팁이
  // 붕 떠 보이지 않고 사이드바 오른쪽에 바짝 붙도록 한다.
  const measure = useCallback(() => {
    if (!active || !step) return;
    const el = document.querySelector(step.selector);
    if (!el) {
      setRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    setRect(padRect(r));

    const extraEl = step.extraSelector ? document.querySelector(step.extraSelector) : null;
    setExtraRect(extraEl ? padRect(extraEl.getBoundingClientRect()) : null);

    const anchorEl = step.anchorSelector ? document.querySelector(step.anchorSelector) : null;
    const anchorR = anchorEl ? anchorEl.getBoundingClientRect() : r;

    const th = tipRef.current?.offsetHeight ?? 190;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let side = step.placement ?? 'bottom';
    if (side === 'bottom' && r.bottom + GAP + th > vh - 12) side = 'top';
    if (side === 'top' && r.top - GAP - th < 12) side = 'bottom';
    if (side === 'right' && anchorR.right + GAP + TIP_W > vw - 12) side = 'left';
    if (side === 'left' && anchorR.left - GAP - TIP_W < 12) side = 'right';

    let top;
    let left;
    if (side === 'bottom') [top, left] = [r.bottom + GAP, r.left + r.width / 2 - TIP_W / 2];
    else if (side === 'top') [top, left] = [r.top - GAP - th, r.left + r.width / 2 - TIP_W / 2];
    else if (side === 'right') [top, left] = [r.top + r.height / 2 - th / 2, anchorR.right + GAP];
    else [top, left] = [r.top + r.height / 2 - th / 2, anchorR.left - GAP - TIP_W];

    left = Math.min(Math.max(12, left), vw - TIP_W - 12);
    top = Math.min(Math.max(12, top), vh - th - 12);
    setTip({ top, left });
  }, [active, step]);

  // 스텝이 바뀌면 대상을 화면 안으로 스크롤한 뒤 측정한다. 대시보드 카드는
  // 데이터가 비동기로 채워지며 레이아웃이 늦게 자리잡을 수 있어서, 고정된
  // 지연 시간(예: 380ms) 한 번만 측정하면 그 타이밍에 대상이 아직 없거나
  // 자리가 덜 잡힌 경우 코치마크가 엉뚱한 위치에 멈추거나 아예 안 보일 수
  // 있다. 그래서 대상을 찾을 때까지(최대 2초) 매 프레임 재측정한다.
  useLayoutEffect(() => {
    if (!active || !step) return undefined;
    document.querySelector(step.selector)?.scrollIntoView({ block: 'center', behavior: 'smooth' });

    let frameId;
    let cancelled = false;
    const startedAt = performance.now();
    const poll = () => {
      if (cancelled) return;
      measure();
      const found = document.querySelector(step.selector);
      const elapsed = performance.now() - startedAt;
      // 대상을 찾았어도 스크롤 애니메이션이 자리잡을 시간을 조금 더 준다.
      if ((found && elapsed > 400) || elapsed > 2000) return;
      frameId = requestAnimationFrame(poll);
    };
    frameId = requestAnimationFrame(poll);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [active, step, measure]);

  useEffect(() => {
    if (!active) return undefined;
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, measure]);

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setStepIndex((v) => Math.min(v + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setStepIndex((v) => Math.max(v - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, steps.length, onClose]);

  if (!active || !step) return null;

  return (
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true" aria-label="대시보드 사용 안내">
      {/* 스포트라이트: 대상만 뚫린 딤 레이어 (SVG 마스크 하나로 처리해 조각난 사각형이 보이지 않음) */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="coachmarks-hole">
            <rect width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="16"
                fill="black"
                style={{ transition: 'all 260ms cubic-bezier(.4,0,.2,1)' }}
              />
            )}
            {extraRect && (
              <rect
                x={extraRect.left}
                y={extraRect.top}
                width={extraRect.width}
                height={extraRect.height}
                rx="16"
                fill="black"
                style={{ transition: 'all 260ms cubic-bezier(.4,0,.2,1)' }}
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgb(15 23 42 / 0.62)" mask="url(#coachmarks-hole)" />
      </svg>

      {/* 하이라이트 링 */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            border: '2px solid #38bdf8',
            boxShadow: '0 0 0 6px rgba(125, 211, 252, 0.22)',
            transition: 'all 260ms cubic-bezier(.4,0,.2,1)',
          }}
        />
      )}
      {extraRect && (
        <div
          className="pointer-events-none absolute rounded-2xl"
          style={{
            top: extraRect.top,
            left: extraRect.left,
            width: extraRect.width,
            height: extraRect.height,
            border: '2px solid #38bdf8',
            boxShadow: '0 0 0 6px rgba(125, 211, 252, 0.22)',
            transition: 'all 260ms cubic-bezier(.4,0,.2,1)',
          }}
        />
      )}

      {/* 툴팁 */}
      <div
        ref={tipRef}
        className="absolute rounded-2xl bg-white p-5 shadow-2xl"
        style={{ top: tip.top, left: tip.left, width: TIP_W, transition: 'top 260ms, left 260ms' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="안내 닫기"
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          <X size={16} />
        </button>

        <p className="text-xs font-semibold tracking-wide text-sky-500">
          {stepIndex + 1} / {steps.length}
        </p>
        <h3 className="mt-1.5 pr-6 text-base font-bold text-slate-900">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onDontShowAgain}
            className="text-xs font-medium text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
          >
            다시 보지 않기
          </button>
          <div className="flex items-center gap-1.5">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStepIndex((v) => Math.max(0, v - 1))}
                className="flex items-center gap-0.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
              >
                <ChevronLeft size={14} /> 이전
              </button>
            )}
            <button
              type="button"
              onClick={() => (isLast ? onFinish() : setStepIndex((v) => Math.min(v + 1, steps.length - 1)))}
              className="flex items-center gap-0.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-sky-600 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
            >
              {isLast ? '완료' : '다음'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
