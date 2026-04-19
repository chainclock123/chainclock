import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useBitcoinData
 *
 * Connects to the mempool.space WebSocket for real-time block data
 * and polls REST endpoints for fees and price.
 *
 * Returns: { blockHeight, blockHash, blockTime, fees, price, satsPerDollar, hashRate, connected }
 */

const WS_URL = 'wss://mempool.space/api/v1/ws';
const FEES_URL = 'https://mempool.space/api/v1/fees/recommended';
const HASHRATE_URL = 'https://mempool.space/api/v1/mining/hashrate/1d';
const PRICE_URL = 'https://mempool.space/api/v1/prices';
const BLOCKS_TIP_URL = 'https://mempool.space/api/blocks/tip/height';

export default function useBitcoinData() {
  const [data, setData] = useState({
    blockHeight: null,
    blockHash: null,
    blockTime: null,
    fees: { low: null, mid: null, high: null },
    price: null,
    satsPerDollar: null,
    hashRate: null,
    connected: false,
  });

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // -- REST polling ----------------------------------------------------------

  const fetchFees = useCallback(async () => {
    try {
      const res = await fetch(FEES_URL);
      if (!res.ok) return;
      const json = await res.json();
      setData((prev) => ({
        ...prev,
        fees: {
          low: json.hourFee,
          mid: json.halfHourFee,
          high: json.fastestFee,
        },
      }));
    } catch (e) {
      console.warn('Fee fetch failed', e);
    }
  }, []);

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(PRICE_URL);
      if (!res.ok) return;
      const json = await res.json();
      const usd = json.USD;
      if (usd) {
        setData((prev) => ({
          ...prev,
          price: Math.round(usd),
          satsPerDollar: Math.round(100_000_000 / usd),
        }));
      }
    } catch (e) {
      console.warn('Price fetch failed', e);
    }
  }, []);

  const fetchHashRate = useCallback(async () => {
    try {
      const res = await fetch(HASHRATE_URL);
      if (!res.ok) return;
      const json = await res.json();
      // currentHashrate is in H/s, convert to EH/s
      if (json.currentHashrate) {
        const ehps = Math.round(json.currentHashrate / 1e18);
        setData((prev) => ({ ...prev, hashRate: ehps }));
      }
    } catch (e) {
      console.warn('Hashrate fetch failed', e);
    }
  }, []);

  const fetchBlockHeight = useCallback(async () => {
    try {
      const res = await fetch(BLOCKS_TIP_URL);
      if (!res.ok) return;
      const height = await res.json();
      setData((prev) => ({ ...prev, blockHeight: height }));
    } catch (e) {
      console.warn('Block height fetch failed', e);
    }
  }, []);

  // -- WebSocket connection ---------------------------------------------------

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setData((prev) => ({ ...prev, connected: true }));
      // Subscribe to new blocks
      ws.send(JSON.stringify({ action: 'want', data: ['blocks'] }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        // New block announced
        if (msg.block) {
          setData((prev) => ({
            ...prev,
            blockHeight: msg.block.height,
            blockHash: msg.block.id,
            blockTime: msg.block.timestamp,
          }));
          // Refresh fees and price when a new block arrives
          fetchFees();
          fetchPrice();
        }
      } catch (e) {
        // Non-JSON messages, ignore
      }
    };

    ws.onclose = () => {
      setData((prev) => ({ ...prev, connected: false }));
      // Auto-reconnect after 5 seconds
      reconnectTimer.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [fetchFees, fetchPrice]);

  // -- Lifecycle --------------------------------------------------------------

  useEffect(() => {
    // Initial data load via REST (fast)
    fetchBlockHeight();
    fetchFees();
    fetchPrice();
    fetchHashRate();

    // Open WebSocket for real-time updates
    connect();

    // Poll fees every 30s, price every 60s, hashrate every 5min
    const feeInterval = setInterval(fetchFees, 30_000);
    const priceInterval = setInterval(fetchPrice, 60_000);
    const hashInterval = setInterval(fetchHashRate, 300_000);

    return () => {
      clearInterval(feeInterval);
      clearInterval(priceInterval);
      clearInterval(hashInterval);
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect, fetchBlockHeight, fetchFees, fetchPrice, fetchHashRate]);

  return data;
}
