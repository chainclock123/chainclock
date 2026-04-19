import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const LIGHTNING_ADDRESS = 'ivoryrabbit5@primal.net';

export default function TipModal({ onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(LIGHTNING_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = LIGHTNING_ADDRESS;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="tip-backdrop" onClick={handleBackdrop}>
      <div className="tip-modal">
        {/* Close button */}
        <button className="tip-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        {/* Lightning icon */}
        <div className="tip-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#ff9500" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <div className="tip-title">zap the dev</div>

        {/* QR code */}
        <div className="tip-qr">
          <QRCodeSVG
            value={`lightning:${LIGHTNING_ADDRESS}`}
            size={180}
            bgColor="#0a0a0a"
            fgColor="#ff9500"
            level="M"
          />
        </div>

        {/* Lightning address + copy */}
        <div className="tip-address-row">
          <span className="tip-address">{LIGHTNING_ADDRESS}</span>
          <button className="tip-copy" onClick={handleCopy}>
            {copied ? 'copied' : 'copy'}
          </button>
        </div>

        <div className="tip-hint">scan with any Lightning wallet</div>
      </div>
    </div>
  );
}
