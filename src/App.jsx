import BlockClockDisplay from './components/BlockClockDisplay';
import TipModal from './components/TipModal';
import NostrPanel from './components/NostrPanel';
import useBitcoinData from './hooks/useBitcoinData';
import useNostr from './hooks/useNostr';
import { useEffect, useState } from 'react';

export default function App() {
  const data = useBitcoinData();
  const nostr = useNostr(data.blockHeight);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [showNostr, setShowNostr] = useState(false);

  // Request a wake lock so the screen stays on (like a real BlockClock)
  useEffect(() => {
    let wakeLock = null;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (e) {
        // Wake lock not supported or denied, no big deal
      }
    }

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) wakeLock.release();
    };
  }, []);

  return (
    <div className={`app ${isFullscreen ? 'app-fullscreen' : ''}`}>
      <BlockClockDisplay data={data} onFullscreenChange={setIsFullscreen} />

      {!isFullscreen && (
        <footer className="footer">
          <a
            href="https://github.com/chainclock123/chainclock"
            target="_blank"
            rel="noopener noreferrer"
          >
            github
          </a>
          <span className="footer-sep">|</span>
          <button className="footer-zap" onClick={() => setShowTip(true)}>
            zap
          </button>
          <span className="footer-sep">|</span>
          <button
            className="footer-zap"
            onClick={() => setShowNostr(true)}
          >
            {nostr.identity.signedIn ? (
              <span className="footer-nostr-active">nostr</span>
            ) : (
              'nostr'
            )}
          </button>
          <span className="footer-sep">|</span>
          <span className="footer-license">MIT</span>
        </footer>
      )}

      {showTip && <TipModal onClose={() => setShowTip(false)} />}
      {showNostr && (
        <NostrPanel
          nostr={nostr}
          blockHeight={data.blockHeight}
          onClose={() => setShowNostr(false)}
        />
      )}
    </div>
  );
}
