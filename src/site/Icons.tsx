/**
 * Lucide line icons, inlined. The playground needs a handful and nothing else
 * does, so pulling in the icon package would be more weight than it is worth.
 */
export type IconProps = { size?: number; strokeWidth?: number }
type Props = IconProps

const svg = (size: number, strokeWidth: number) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const Plus = ({ size = 17, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
)

export const Minus = ({ size = 17, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M5 12h14" />
  </svg>
)

export const Rotate3d = ({ size = 18, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="m15.194 13.707 3.814 1.86-1.86 3.814" />
    <path d="M16.47214 7.52786 A 5 10 0 1 0 13 21.79796" />
    <path d="M21.79796 11 A 10 5 0 1 0 19 15.57071" />
  </svg>
)

export const Pause = ({ size = 16, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <rect x="14" y="3" width="5" height="18" rx="1" />
    <rect x="5" y="3" width="5" height="18" rx="1" />
  </svg>
)

export const Play = ({ size = 16, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)} fill="currentColor" stroke="none">
    <path d="M6 3.5v17a1 1 0 0 0 1.5.87l14-8.5a1 1 0 0 0 0-1.74l-14-8.5A1 1 0 0 0 6 3.5Z" />
  </svg>
)

export const RotateCcw = ({ size = 17, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
)

export const Shuffle = ({ size = 18, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="m18 14 4 4-4 4" />
    <path d="m18 2 4 4-4 4" />
    <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
    <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
    <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
  </svg>
)

export const ArrowUpRight = ({ size = 20, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
)

export const ArrowRight = ({ size = 15, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

export const ArrowDown = ({ size = 15, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
)

export const Move = ({ size = 14, strokeWidth = 2 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="m15 5-3-3-3 3" />
    <path d="m15 19-3 3-3-3" />
    <path d="m5 9-3 3 3 3" />
    <path d="m19 9 3 3-3 3" />
  </svg>
)

export const Hand = ({ size = 15, strokeWidth = 1.8 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </svg>
)

// --- Category icons, one per desk object ---------------------------------

export const Network = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <rect x="16" y="16" width="6" height="6" rx="1" />
    <rect x="2" y="16" width="6" height="6" rx="1" />
    <rect x="9" y="2" width="6" height="6" rx="1" />
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
    <path d="M12 12V8" />
  </svg>
)

export const Tv = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="m17 2-5 5-5-5" />
    <rect width="20" height="15" x="2" y="7" rx="2" />
  </svg>
)

export const HeartPulse = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    <path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
  </svg>
)

export const Plane = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
)

export const Container = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z" />
    <path d="M10 21.9V14L2.1 9.1" />
    <path d="m10 14 11.9-6.9" />
    <path d="M14 19.8v-8.1" />
    <path d="M18 17.5V9.4" />
  </svg>
)

export const Server = ({ size = 21, strokeWidth = 1.65 }: Props) => (
  <svg {...svg(size, strokeWidth)}>
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
)
