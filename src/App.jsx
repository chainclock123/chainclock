import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [blockHeight, setBlockHeight] = useState(null)
  const [blockHash, setBlockHash] = useState(null)
  const [blockTime, setBlockTime] = useState(null)
  const [mempool, setMempool] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const [timeSinceBlock, setTimeSinceBlock] = useState(0)

  // Fetch block data
  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const heightRes = await axios.get('https://mempool.space/api/blocks/tip/height')
        const blockRes = await axios.get(`https://mempool.space/api/block/${heightRes.data}`)
        
        setBlockHeight(heightRes.data)
        setBlockHash(blockRes.data.id)
        setBlockTime(blockRes.data.timestamp)
      } catch (error) {
        console.error('Failed to fetch block data:', error)
      }
    }

    fetchBlockData()
  }, [])

  // WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket('wss://mempool.space/api/v1/blocks')
    
    ws.onmessage = (event) => {
      const block = JSON.parse(event.data)
      setBlockHeight(block.height)
      setBlockHash(block.id)
      setBlockTime(block.timestamp)
      setTimeSinceBlock(0)
    }

    return () => ws.close()
  }, [])

  // Update time since block
  useEffect(() => {
    const interval = setInterval(() => {
      if (blockTime) {
        const now = Math.floor(Date.now() / 1000)
        setTimeSinceBlock(now - blockTime)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [blockTime])

  // Fetch mempool stats
  useEffect(() => {
    const fetchMempool = async () => {
      try {
        const res = await axios.get('https://mempool.space/api/v1/fees/recommended')
        setMempool(res.data)
      } catch (error) {
        console.error('Failed to fetch mempool:', error)
      }
    }

    fetchMempool()
    const interval = setInterval(fetchMempool, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (!darkMode) {
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
    }
  }

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode')
    } else {
      document.body.classList.add('light-mode')
    }
  }, [darkMode])

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">⛓️ CHAINCLOCK</h1>
        <p className="subtitle">Bitcoin Block Viewer • NOSTR Native</p>
      </div>

      <div className="controls">
        <button onClick={toggleDarkMode}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="block-display">
        {blockHeight && (
          <>
            <div className="block-counter">{blockHeight}</div>
            {blockHash && <div className="block-hash">#{blockHash.slice(0, 16)}...</div>}
          </>
        )}
      </div>

      {blockTime && (
        <div className="block-stats">
          <div className="stat">
            <div className="stat-label">Time Since</div>
            <div className="stat-value">{timeSinceBlock}s</div>
          </div>
          <div className="stat">
            <div className="stat-label">Block Time</div>
            <div className="stat-value">{new Date(blockTime * 1000).toLocaleTimeString()}</div>
          </div>
        </div>
      )}

      {mempool && (
        <div className="block-stats">
          <div className="stat">
            <div className="stat-label">Low Fee</div>
            <div className="stat-value">{mempool.slowFee} sat/vB</div>
          </div>
          <div className="stat">
            <div className="stat-label">Mid Fee</div>
            <div className="stat-value">{mempool.standardFee} sat/vB</div>
          </div>
          <div className="stat">
            <div className="stat-label">High Fee</div>
            <div className="stat-value">{mempool.fastFee} sat/vB</div>
          </div>
        </div>
      )}

      <div className="footer">
        <p>⛓️ ChainClock - Open Source Bitcoin Block Viewer</p>
        <p><a href="https://github.com/chainclock123/chainclock" target="_blank" rel="noopener noreferrer">GitHub</a></p>
        <p>NOSTR: npub1gpstrhdp9vly68x7rl99awypecktes6nfqak5xqyqf8vt8qc3ueqxk40g8</p>
      </div>
    </div>
  )
}

export default App
