// Small "(i)" hover/focus tooltip — no equivalent primitive exists elsewhere
// in the codebase yet, so this is a minimal self-contained component.
export function InfoTooltip({ text, children, wide = false }) {
  return (
    <span className={`info-tooltip${wide ? ' info-tooltip--wide' : ''}`} tabIndex={0}>
      <span className="info-tooltip-icon" aria-hidden="true">i</span>
      <span className="info-tooltip-bubble" role="tooltip">{children || text}</span>
    </span>
  );
}
