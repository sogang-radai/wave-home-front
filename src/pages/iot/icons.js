// Icon set for the Home Control page — same convention as
// pages/settings/SettingsUI.js (24x24 viewBox, stroke=currentColor) so icons
// drop into any button regardless of theme/color.

const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function PencilIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function ReconnectIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function CameraShutterIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 8h3l1.6-2.4A2 2 0 0 1 10.3 4.6h3.4a2 2 0 0 1 1.7 1L17 8h3a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function MicIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1" />
      <path d="M12 18v4" />
      <path d="M8 22h8" />
    </svg>
  );
}

export function SpeakerMuteIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
      <path d="M17 9l5 6" />
      <path d="M22 9l-5 6" />
    </svg>
  );
}

export function SpeakerOnIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 9v6h4l5 5V4L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19.3 6a9 9 0 0 1 0 12" />
    </svg>
  );
}

export function SendIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
  );
}

export function PowerIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M12 2v8" />
      <path d="M18.4 6.6a9 9 0 1 1-12.8 0" />
    </svg>
  );
}

export function InputIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 9l3 3-3 3" />
      <path d="M13 15h4" />
    </svg>
  );
}

export function ChevronUpIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M6 15l6-6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function BackIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M11 6l-6 6 6 6" />
      <path d="M5 12h14a4 4 0 0 1 0 8h-2" />
    </svg>
  );
}

export function PlayIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M7 4l13 8-13 8V4z" />
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <svg {...iconBase} {...props}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}
