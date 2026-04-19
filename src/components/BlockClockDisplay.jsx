import { useState, useEffect, useRef, useCallback } from 'react';
import SevenSegment, { Colon, CommaSeparator } from './SevenSegment';

/**
 * BlockClockDisplay
 *
 * Renders all Bitcoin metric screens using seven-segment digits
 * and cycles through them automatically (or on tap/click).
 *
 * Props:
 *   data - object from useBitcoinData hook
 */

const AUTO_ADVANCE_MS = 8000;

// Format a number with comma separators into an array of characters
// e.g. 893241 -> ['8','9','3',',','2','4','1']
function formatWithCommas(num) {
  if (num == null) return [];
  const str = String(num);
  const chars = [];
  const len = str.length;
  for (let i = 0; i < len; i++) {
    chars.push(str[i]);
    const remaining = len - 1 - i;
    if (remaining > 0 && remaining % 3 === 0) {
      chars.push(',');
    }
  }
  return chars;
}

// Pad an array of characters to a target length (right-aligned)
function padLeft(chars, targetLen, padChar = ' ') {
  while (chars.length < targetLen) {
    chars.unshift(padChar);
  }
  return chars;
}

// -- Screen definitions -------------------------------------------------------

function screenBlockHeight(data) {
  const height = data.blockHeight;
  if (height == null) return { label: 'BLOCK HEIGHT', chars: ['L','o','A','d',' ','i','n','G'] };
  const chars = formatWithCommas(height);
  return { label: 'BLOCK HEIGHT', chars: padLeft(chars, 8) };
}

function screenPrice(data) {
  const price = data.price;
  if (price == null) return { label: 'BTC / USD', chars: [' ',' ','L','o','A','d',' ',' '] };
  const chars = formatWithCommas(price);
  // Prepend a blank space where a $ symbol would sit
  return { label: 'BTC / USD', chars: padLeft(chars, 8) };
}

function screenMoscowTime(data) {
  const sats = data.satsPerDollar;
  if (sats == null) return { label: 'MOSCOW TIME', chars: [' ',' ','L','o','A','d',' ',' '] };
  const sStr = formatWithCommas(sats);
  // Show "SAtS" prefix then the number
  const prefix = ['S','A','t','S',' '];
  const numPadded = padLeft(sStr, 4);
  return { label: 'MOSCOW TIME', chars: [...prefix, ...numPadded] };
}

function screenHashRate(data) {
  const hr = data.hashRate;
  if (hr == null) return { label: 'HASH RATE  EH/S', chars: [' ',' ',' ','L','o','A','d',' '] };
  const hrStr = String(hr).split('');
  const padded = padLeft(hrStr, 4);
  return { label: 'HASH RATE  EH/S', chars: [' ',' ',' ', ...padded, ' ', 'E', 'h'] };
}

function screenFees(data) {
  const fee = data.fees.mid;
  if (fee == null) return { label: 'SUGGESTED FEE  SAT/VB', chars: ['F','E','E',' ',' ','L','d',' '] };
  const fStr = String(fee).split('');
  const padded = padLeft(fStr, 3);
  return { label: 'SUGGESTED FEE  SAT/VB', chars: ['F','E','E',' ',' ', ...padded, ' '] };
}

function screenTime() {
  const now = new Date();
  const h = String(now.getUTCHours()).padStart(2, '0');
  const m = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  return {
    label: 'TIME  UTC',
    chars: [' ', h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]],
  };
}

const SCREENS = [
  screenBlockHeight,
  screenPrice,
  screenMoscowTime,
  screenHashRate,
  screenFees,
  screenTime,
];

// -- Component ----------------------------------------------------------------

export default function BlockClockDisplay({ data }) {
  const [activeScreen, setActiveScreen] = useState(0);
  const [digitSize, setDigitSize] = useState(42);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Responsive digit sizing
  useEffect(() => {
    function handleResize() {
      if (!containerRef.current) return;
      const w = containerRef.current.offsetWidth;
      // 9 digits + separators need roughly 11 "units" of width
      // Each digit is ~42px at base, so scale to fill available width
      const targetDigitW = Math.floor((w - 48) / 11);
      setDigitSize(Math.min(Math.max(targetDigitW, 24), 56));
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-advance timer
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % SCREENS.length);
    }, AUTO_ADVANCE_MS);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => clearInterval(timerRef.current);
  }, [resetTimer]);

  // Keep the time screen updating every second
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Build the current screen
  const screenFn = SCREENS[activeScreen];
  const screen = screenFn(data);

  const handleTap = () => {
    setActiveScreen((prev) => (prev + 1) % SCREENS.length);
    resetTimer();
  };

  const goTo = (i) => {
    setActiveScreen(i);
    resetTimer();
  };

  // Render the character array into SevenSegment components
  const renderChars = (chars) =>
    chars.map((ch, i) => {
      if (ch === ',') return <CommaSeparator key={`sep-${i}`} size={digitSize} />;
      if (ch === ':') return <Colon key={`col-${i}`} size={digitSize} />;
      return <SevenSegment key={`d-${i}`} char={ch} size={digitSize} />;
    });

  return (
    <div className="bc-outer">
      <div
        className="bc-housing"
        ref={containerRef}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleTap()}
        aria-label="Tap to cycle screens"
      >
        {/* Connection indicator */}
        <div className="bc-status">
          <span
            className={`bc-status-dot ${data.connected ? 'connected' : ''}`}
          />
        </div>

        {/* Screen label */}
        <div className="bc-label">{screen.label}</div>

        {/* Seven-segment display area */}
        <div className="bc-display">{renderChars(screen.chars)}</div>

        {/* Device badge */}
        <div className="bc-badge">CHAINCLOCK</div>
      </div>

      {/* Navigation dots */}
      <div className="bc-nav">
        {SCREENS.map((_, i) => (
          <button
            key={i}
            className={`bc-nav-dot ${i === activeScreen ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              goTo(i);
            }}
            aria-label={`Screen ${i + 1}`}
          />
        ))}
      </div>

      <div className="bc-hint">tap display to cycle</div>
    </div>
  );
}
