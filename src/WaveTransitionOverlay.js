import './WaveTransitionOverlay.css';

export function WaveTransitionOverlay({ active }) {
  if (!active) return null;
  const bubbles = Array.from({ length: 18 }, (_, index) => ({
    left: 5 + ((index * 17) % 90),
    size: 15 + ((index * 7) % 28),
    delay: index * 0.018,
    duration: 0.62 + index * 0.018,
    drift: -26 + ((index * 13) % 54),
  }));
  return (
    <div className="wave-overlay" aria-hidden="true">
      <div className="wave-overlay-fill" />
      <div className="wave-overlay-ripple" />
      <div className="wave-overlay-surface">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none">
          <path d="M0,72 C130,130 260,18 420,74 C590,134 760,22 940,72 C1060,106 1130,78 1200,54 L1200,160 L0,160 Z" />
        </svg>
      </div>
      <div className="wave-overlay-bubbles">
        {bubbles.map((_, index) => (
          <span
            key={index}
            style={{
              '--bubble-left': `${bubbles[index].left}%`,
              '--bubble-size': `${bubbles[index].size}px`,
              '--bubble-delay': `${bubbles[index].delay}s`,
              '--bubble-duration': `${bubbles[index].duration}s`,
              '--bubble-drift': `${bubbles[index].drift}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
