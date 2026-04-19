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

function screenTime(data, useUtc) {
  const now = new Date();
  if (useUtc) {
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    return {
      label: 'TIME  UTC',
      chars: [' ', h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]],
      toggleable: true,
    };
  }
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const tz = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now)
    .find((p) => p.type === 'timeZoneName')?.value || 'LOCAL';
  return {
    label: `TIME  ${tz}`,
    chars: [' ', h[0], h[1], ':', m[0], m[1], ':', s[0], s[1]],
    toggleable: true,
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

export default function BlockClockDisplay({ data, onFullscreenChange }) {
  const [activeScreen, setActiveScreen] = useState(0);
  const [digitSize, setDigitSize] = useState(42);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useUtc, setUseUtc] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cc-utc')) ?? false; } catch { return false; }
  });
  const timerRef = useRef(null);
  const containerRef = useRef(null);
  const outerRef = useRef(null);

  // -- Fullscreen API ---------------------------------------------------------

  const enterFullscreen = useCallback(async (e) => {
    e.stopPropagation();
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen(); // Safari
      }
    } catch (err) {
      // Fullscreen not supported (e.g. iPhone Safari in-browser)
      // Fall back to a CSS-only "fake" fullscreen
      setIsFullscreen(true);
      if (onFullscreenChange) onFullscreenChange(true);
    }
  }, [onFullscreenChange]);

  const exitFullscreen = useCallback((e) => {
    e.stopPropagation();
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      // CSS-only fallback
      setIsFullscreen(false);
      if (onFullscreenChange) onFullscreenChange(false);
    }
  }, [onFullscreenChange]);

  // Sync state with the browser's fullscreen events
  useEffect(() => {
    function handleChange() {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (onFullscreenChange) onFullscreenChange(fs);
    }
    document.addEventListener('fullscreenchange', handleChange);
    document.addEventListener('webkitfullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
      document.removeEventListener('webkitfullscreenchange', handleChange);
    };
  }, [onFullscreenChange]);

  // Lock to landscape when fullscreen (where supported)
  useEffect(() => {
    if (!isFullscreen) return;
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {
      // Not supported, no problem
    }
    return () => {
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {}
    };
  }, [isFullscreen]);

  // -- Responsive digit sizing ------------------------------------------------

  useEffect(() => {
    function handleResize() {
      if (isFullscreen) {
        // In fullscreen, use viewport dimensions directly
        // (container offsetWidth/Height can be stale during transitions)
        const w = window.innerWidth;
        const h = window.innerHeight;
        const wBased = Math.floor((w - 48) / 11);
        const hBased = Math.floor((h - 80) / 1.72);
        setDigitSize(Math.min(wBased, hBased, 120));
      } else {
        if (!containerRef.current) return;
        const w = containerRef.current.offsetWidth;
        const targetDigitW = Math.floor((w - 48) / 11);
        setDigitSize(Math.min(Math.max(targetDigitW, 24), 56));
      }
    }

    // Delay first calculation to let the DOM settle after class changes
    const raf = requestAnimationFrame(() => {
      handleResize();
    });

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [isFullscreen]);

  // -- Screen cycling ---------------------------------------------------------

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

  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const screenFn = SCREENS[activeScreen];
  const screen = screenFn(data, useUtc);

  const handleTap = () => {
    setActiveScreen((prev) => (prev + 1) % SCREENS.length);
    resetTimer();
  };

  const handleLabelTap = (e) => {
    if (screen.toggleable) {
      e.stopPropagation();
      const next = !useUtc;
      setUseUtc(next);
      try { localStorage.setItem('cc-utc', JSON.stringify(next)); } catch {}
    }
  };

  const goTo = (i) => {
    setActiveScreen(i);
    resetTimer();
  };

  const renderChars = (chars) =>
    chars.map((ch, i) => {
      if (ch === ',') return <CommaSeparator key={`sep-${i}`} size={digitSize} />;
      if (ch === ':') return <Colon key={`col-${i}`} size={digitSize} />;
      return <SevenSegment key={`d-${i}`} char={ch} size={digitSize} />;
    });

  // -- Render -----------------------------------------------------------------

  return (
    <div className={`bc-outer ${isFullscreen ? 'bc-fullscreen' : ''}`} ref={outerRef}>
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

        {/* Fullscreen toggle */}
        {!isFullscreen && (
          <button
            className="bc-fs-btn"
            onClick={enterFullscreen}
            aria-label="Enter fullscreen"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,2 2,2 2,6" />
              <polyline points="14,2 18,2 18,6" />
              <polyline points="6,18 2,18 2,14" />
              <polyline points="14,18 18,18 18,14" />
            </svg>
          </button>
        )}

        {/* Exit fullscreen button */}
        {isFullscreen && (
          <button
            className="bc-fs-exit"
            onClick={exitFullscreen}
            aria-label="Exit fullscreen"
          >
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="2,6 6,6 6,2" />
              <polyline points="18,6 14,6 14,2" />
              <polyline points="2,14 6,14 6,18" />
              <polyline points="18,14 14,14 14,18" />
            </svg>
          </button>
        )}

        {/* Screen label */}
        {/* Screen label - tappable on time screen to toggle UTC/local */}
        <div
          className={`bc-label ${screen.toggleable ? 'bc-label-toggle' : ''}`}
          onClick={screen.toggleable ? handleLabelTap : undefined}
        >
          {screen.label}
        </div>

        {/* Seven-segment display area */}
        <div className="bc-display">{renderChars(screen.chars)}</div>

        {/* Device badge */}
        <div className="bc-badge">CHAINCLOCK</div>
      </div>

      {/* Navigation dots - hidden in fullscreen */}
      {!isFullscreen && (
        <>
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
        </>
      )}
    </div>
  );
}
