/**
 * SevenSegment.jsx
 *
 * Renders a single seven-segment digit as an inline SVG.
 * Active segments glow amber; inactive segments show a faint
 * "ghost" outline, replicating the look of a real LED display.
 *
 *   _a_
 *  |   |
 *  f   b
 *  |_g_|
 *  |   |
 *  e   c
 *  |_d_|
 */

const AMBER = '#ff9500';
const GHOST = '#1a1700';

const SEGMENT_PATHS = {
  a: 'M8,2 L34,2 L30,8 L12,8 Z',
  b: 'M36,4 L36,33 L31,29 L31,10 Z',
  c: 'M36,39 L36,68 L31,62 L31,43 Z',
  d: 'M8,70 L34,70 L30,64 L12,64 Z',
  e: 'M6,39 L6,68 L11,62 L11,43 Z',
  f: 'M6,4 L6,33 L11,29 L11,10 Z',
  g: 'M8,36 L12,32 L30,32 L34,36 L30,40 L12,40 Z',
};

// Which segments light up for each character
const CHAR_MAP = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
  '-': 'g',
  ' ': '',
  // Letters used by the BlockClock for labels
  A: 'abcefg',
  b: 'cdefg',
  C: 'adef',
  d: 'bcdeg',
  E: 'adefg',
  F: 'aefg',
  G: 'acdef',
  H: 'bcefg',
  h: 'cefg',
  I: 'ef',
  i: 'c',
  J: 'bcd',
  L: 'def',
  n: 'ceg',
  o: 'cdeg',
  P: 'abefg',
  r: 'eg',
  S: 'acdfg',
  t: 'defg',
  U: 'bcdef',
  u: 'cde',
  Y: 'bcdfg',
};

export default function SevenSegment({ char = ' ', size = 42 }) {
  const active = CHAR_MAP[char] || '';
  const scale = size / 42;

  return (
    <svg
      width={size}
      height={Math.round(72 * scale)}
      viewBox="0 0 42 72"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      {Object.entries(SEGMENT_PATHS).map(([seg, d]) => (
        <path
          key={seg}
          d={d}
          fill={active.includes(seg) ? AMBER : GHOST}
        />
      ))}
    </svg>
  );
}

/**
 * Renders a colon separator (two dots stacked vertically).
 * Used between hours:minutes:seconds on the time screen.
 */
export function Colon({ size = 42 }) {
  const dotSize = Math.round(size * 0.14);
  const height = Math.round(72 * (size / 42));
  return (
    <div
      style={{
        width: Math.round(size * 0.33),
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(size * 0.28),
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: AMBER,
        }}
      />
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: AMBER,
        }}
      />
    </div>
  );
}

/**
 * Renders a comma or decimal point below a digit position.
 */
export function CommaSeparator({ size = 42 }) {
  const dotSize = Math.round(size * 0.14);
  const height = Math.round(72 * (size / 42));
  return (
    <div
      style={{
        width: Math.round(size * 0.24),
        height,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: Math.round(size * 0.1),
          left: 1,
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          background: AMBER,
        }}
      />
    </div>
  );
}
