import { useState, useEffect, useCallback, useRef } from 'react';
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';
import { decode, npubEncode, nsecEncode } from 'nostr-tools/nip19';
import { SimplePool } from 'nostr-tools/pool';

/**
 * useNostr
 *
 * Manages NOSTR identity (NIP-07 extension or raw nsec),
 * publishes notes to relays, and handles scheduled publishing
 * at a target block height.
 */

const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://relay.primal.net',
];

const STORAGE_KEY = 'cc-nostr';
const SCHEDULED_KEY = 'cc-scheduled';

export default function useNostr(blockHeight) {
  const [identity, setIdentity] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored?.pubkey) return { ...stored, signedIn: true };
    } catch {}
    return { pubkey: null, npub: null, method: null, signedIn: false };
  });

  const [scheduledNotes, setScheduledNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(SCHEDULED_KEY)) || [];
    } catch { return []; }
  });

  const [publishing, setPublishing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const poolRef = useRef(null);
  const secretKeyRef = useRef(null);

  // Initialise relay pool
  useEffect(() => {
    poolRef.current = new SimplePool();
    return () => {
      if (poolRef.current) {
        poolRef.current.close(DEFAULT_RELAYS);
      }
    };
  }, []);

  // Persist identity
  useEffect(() => {
    if (identity.signedIn) {
      // Never store the secret key — only pubkey + method
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        pubkey: identity.pubkey,
        npub: identity.npub,
        method: identity.method,
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [identity]);

  // Persist scheduled notes
  useEffect(() => {
    localStorage.setItem(SCHEDULED_KEY, JSON.stringify(scheduledNotes));
  }, [scheduledNotes]);

  // -- Sign in methods --------------------------------------------------------

  const signInWithExtension = useCallback(async () => {
    if (!window.nostr) {
      setLastResult({ ok: false, message: 'No NOSTR extension found. Install Alby or nos2x.' });
      return false;
    }
    try {
      const pubkey = await window.nostr.getPublicKey();
      const npub = npubEncode(pubkey);
      setIdentity({ pubkey, npub, method: 'nip07', signedIn: true });
      secretKeyRef.current = null;
      setLastResult(null);
      return true;
    } catch (e) {
      setLastResult({ ok: false, message: 'Extension sign-in rejected.' });
      return false;
    }
  }, []);

  const signInWithNsec = useCallback((nsecStr) => {
    try {
      const { type, data } = decode(nsecStr.trim());
      if (type !== 'nsec') {
        setLastResult({ ok: false, message: 'Invalid nsec key.' });
        return false;
      }
      const pubkey = getPublicKey(data);
      const npub = npubEncode(pubkey);
      secretKeyRef.current = data;
      setIdentity({ pubkey, npub, method: 'nsec', signedIn: true });
      setLastResult(null);
      return true;
    } catch (e) {
      setLastResult({ ok: false, message: 'Invalid nsec key.' });
      return false;
    }
  }, []);

  const signOut = useCallback(() => {
    secretKeyRef.current = null;
    setIdentity({ pubkey: null, npub: null, method: null, signedIn: false });
    setLastResult(null);
  }, []);

  // -- Publishing -------------------------------------------------------------

  const buildEvent = useCallback((content, currentBlockHeight) => {
    const blockStr = String(currentBlockHeight);
    return {
      kind: 1,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['block', blockStr],
        ['t', 'chainclock'],
        ['t', 'bitcoin'],
      ],
      content: `${content}\n\n⛓ Block # ${Number(blockStr).toLocaleString()} | https://chainclock.world`,
    };
  }, []);

  const publishNote = useCallback(async (content) => {
    if (!identity.signedIn || !blockHeight) return false;
    setPublishing(true);
    setLastResult(null);

    try {
      const event = buildEvent(content, blockHeight);
      let signedEvent;

      if (identity.method === 'nip07' && window.nostr) {
        signedEvent = await window.nostr.signEvent(event);
      } else if (identity.method === 'nsec' && secretKeyRef.current) {
        signedEvent = finalizeEvent(event, secretKeyRef.current);
      } else {
        setLastResult({ ok: false, message: 'Sign in again to publish.' });
        setPublishing(false);
        return false;
      }

      await Promise.any(
        poolRef.current.publish(DEFAULT_RELAYS, signedEvent)
      );

      setLastResult({ ok: true, message: `Published at block #${Number(blockHeight).toLocaleString()}` });
      setPublishing(false);
      return true;
    } catch (e) {
      setLastResult({ ok: false, message: 'Failed to publish. Try again.' });
      setPublishing(false);
      return false;
    }
  }, [identity, blockHeight, buildEvent]);

  // -- Scheduled notes --------------------------------------------------------

  const scheduleNote = useCallback((content, targetBlock) => {
    const note = {
      id: Date.now(),
      content,
      targetBlock: Number(targetBlock),
      createdAt: Date.now(),
    };
    setScheduledNotes((prev) => [...prev, note]);
    setLastResult({ ok: true, message: `Scheduled for block #${Number(targetBlock).toLocaleString()}` });
  }, []);

  const removeScheduledNote = useCallback((id) => {
    setScheduledNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Check scheduled notes against current block height
  useEffect(() => {
    if (!blockHeight || !identity.signedIn || scheduledNotes.length === 0) return;

    const ready = scheduledNotes.filter((n) => blockHeight >= n.targetBlock);
    if (ready.length === 0) return;

    ready.forEach(async (note) => {
      const event = buildEvent(note.content, blockHeight);
      let signedEvent;

      try {
        if (identity.method === 'nip07' && window.nostr) {
          signedEvent = await window.nostr.signEvent(event);
        } else if (identity.method === 'nsec' && secretKeyRef.current) {
          signedEvent = finalizeEvent(event, secretKeyRef.current);
        } else {
          return; // Can't sign, leave it scheduled
        }

        await Promise.any(
          poolRef.current.publish(DEFAULT_RELAYS, signedEvent)
        );

        removeScheduledNote(note.id);
      } catch {
        // Leave scheduled, will retry next block
      }
    });
  }, [blockHeight, identity, scheduledNotes, buildEvent, removeScheduledNote]);

  return {
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
    clearResult: () => setLastResult(null),
  };
}
