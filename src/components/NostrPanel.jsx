import { useState } from 'react';

/**
 * NostrPanel
 *
 * Slide-up panel for NOSTR sign-in and note publishing.
 * Supports NIP-07 browser extension and raw nsec sign-in.
 * Notes can be published live (at current block) or scheduled
 * for a future block height.
 */

export default function NostrPanel({ nostr, blockHeight, onClose }) {
  const {
    identity,
    publishing,
    lastResult,
    scheduledNotes,
    signInWithExtension,
    signInWithNsec,
    signOut,
    publishNote,
    scheduleNote,
    removeScheduledNote,
    clearResult,
  } = nostr;

  const [nsecInput, setNsecInput] = useState('');
  const [noteText, setNoteText] = useState('');
  const [mode, setMode] = useState('live'); // 'live' | 'scheduled'
  const [targetBlock, setTargetBlock] = useState('');
  const [showNsec, setShowNsec] = useState(false);

  // -- Handlers ---------------------------------------------------------------

  const handleNsecLogin = () => {
    if (signInWithNsec(nsecInput)) {
      setNsecInput('');
      setShowNsec(false);
    }
  };

  const handlePublish = async () => {
    if (!noteText.trim()) return;

    if (mode === 'scheduled') {
      const target = Number(targetBlock);
      if (!target || target <= blockHeight) {
        return; // Invalid target
      }
      scheduleNote(noteText.trim(), target);
      setNoteText('');
      setTargetBlock('');
    } else {
      const ok = await publishNote(noteText.trim());
      if (ok) setNoteText('');
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // -- Render: Sign-in view ---------------------------------------------------

  if (!identity.signedIn) {
    return (
      <div className="nostr-backdrop" onClick={handleBackdrop}>
        <div className="nostr-panel">
          <button className="nostr-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>

          <div className="nostr-title">sign in with nostr</div>

          <button className="nostr-btn nostr-btn-primary" onClick={signInWithExtension}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            use browser extension
          </button>

          <div className="nostr-divider">
            <span>or</span>
          </div>

          {!showNsec ? (
            <button
              className="nostr-btn nostr-btn-secondary"
              onClick={() => setShowNsec(true)}
            >
              paste nsec key
            </button>
          ) : (
            <div className="nostr-nsec-form">
              <input
                type="password"
                className="nostr-input"
                placeholder="nsec1..."
                value={nsecInput}
                onChange={(e) => setNsecInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNsecLogin()}
                autoComplete="off"
              />
              <div className="nostr-nsec-warn">
                your key is never stored or transmitted
              </div>
              <button className="nostr-btn nostr-btn-primary" onClick={handleNsecLogin}>
                sign in
              </button>
            </div>
          )}

          {lastResult && !lastResult.ok && (
            <div className="nostr-error">{lastResult.message}</div>
          )}
        </div>
      </div>
    );
  }

  // -- Render: Compose view (signed in) ---------------------------------------

  return (
    <div className="nostr-backdrop" onClick={handleBackdrop}>
      <div className="nostr-panel">
        <button className="nostr-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="4" x2="16" y2="16" />
            <line x1="16" y1="4" x2="4" y2="16" />
          </svg>
        </button>

        {/* Identity bar */}
        <div className="nostr-identity">
          <div className="nostr-npub" title={identity.npub}>
            {identity.npub?.slice(0, 12)}...{identity.npub?.slice(-6)}
          </div>
          <button className="nostr-sign-out" onClick={signOut}>
            sign out
          </button>
        </div>

        {/* Mode toggle */}
        <div className="nostr-mode-row">
          <button
            className={`nostr-mode-btn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
          >
            publish now
          </button>
          <button
            className={`nostr-mode-btn ${mode === 'scheduled' ? 'active' : ''}`}
            onClick={() => setMode('scheduled')}
          >
            schedule
          </button>
        </div>

        {/* Current block indicator */}
        <div className="nostr-block-info">
          {mode === 'live' ? (
            <>current block: <strong>#{blockHeight ? Number(blockHeight).toLocaleString() : '...'}</strong></>
          ) : (
            <div className="nostr-target-row">
              <span>target block:</span>
              <input
                type="number"
                className="nostr-input nostr-input-small"
                placeholder={blockHeight ? String(blockHeight + 144) : ''}
                value={targetBlock}
                onChange={(e) => setTargetBlock(e.target.value)}
              />
            </div>
          )}
        </div>

        {mode === 'scheduled' && targetBlock && blockHeight && (
          <div className="nostr-eta">
            ~{Math.max(0, Math.round((Number(targetBlock) - blockHeight) * 10 / 60))} hours from now
            ({Math.max(0, Number(targetBlock) - blockHeight)} blocks)
          </div>
        )}

        {/* Compose area */}
        <textarea
          className="nostr-compose"
          placeholder={mode === 'live'
            ? 'write a note anchored to this block...'
            : 'write a note to publish at the target block...'
          }
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          maxLength={500}
          rows={3}
        />

        <div className="nostr-compose-footer">
          <span className="nostr-char-count">{noteText.length}/500</span>
          <button
            className="nostr-btn nostr-btn-primary"
            onClick={handlePublish}
            disabled={publishing || !noteText.trim() || (mode === 'scheduled' && (!targetBlock || Number(targetBlock) <= blockHeight))}
          >
            {publishing ? 'publishing...' : mode === 'live' ? 'publish' : 'schedule'}
          </button>
        </div>

        {/* Result message */}
        {lastResult && (
          <div className={`nostr-result ${lastResult.ok ? 'ok' : 'err'}`}>
            {lastResult.message}
          </div>
        )}

        {/* Scheduled notes list */}
        {scheduledNotes.length > 0 && (
          <div className="nostr-scheduled">
            <div className="nostr-scheduled-title">scheduled notes</div>
            {scheduledNotes.map((note) => (
              <div key={note.id} className="nostr-scheduled-item">
                <div className="nostr-scheduled-meta">
                  block #{Number(note.targetBlock).toLocaleString()}
                  <button
                    className="nostr-scheduled-remove"
                    onClick={() => removeScheduledNote(note.id)}
                  >
                    cancel
                  </button>
                </div>
                <div className="nostr-scheduled-text">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
