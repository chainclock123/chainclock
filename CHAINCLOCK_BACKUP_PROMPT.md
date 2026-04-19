# ChainClock - Project Backup & Restoration Prompt

## Project Overview
ChainClock is an open-source Bitcoin block viewer PWA with NOSTR integration.

**Domain:** chainclock.world
**GitHub:** github.com/chainclock123/chainclock
**NOSTR Public Key:** npub1gpstrhdp9vly68x7rl99awypecktes6nfqak5xqyqf8vt8qc3ueqxk40g8

## Current Stack
- Frontend: React 18 + Vite
- Hosting: Vercel (auto-deploys from GitHub)
- Data Source: Mempool.space API (WebSocket for real-time blocks)
- Payment: NOSTR Zaps (tipping via Lightning)
- PWA: Vite PWA plugin

## Current Features (Live)
✅ Real-time block counter (WebSocket updates)
✅ Block hash display
✅ Mempool fee statistics (low/mid/high)
✅ Time since last block
✅ Dark/Light mode toggle
✅ Mobile responsive
✅ PWA installable

## Planned Features (Not Yet Built)
- NOSTR sign-in (users can authenticate with their NOSTR key)
- Live note publishing at current block height
- Scheduled note publishing at future block height
- NOSTR Zap integration (tipping UI with QR code)
- Note feed display (community notes)

## File Structure


## Environment & Deployment
- **Vercel:** Auto-deploys on GitHub push (chainclock.world)
- **GitHub:** chainclock123/chainclock (public, MIT license)
- **Node Version:** 24.x
- **Build Command:** `npm run build`

## Key Dependencies
- react@18.2.0, react-dom@18.2.0
- axios@1.6.0 (API calls)
- nostr-tools@1.13.0 (NOSTR integration)
- qrcode.react@3.1.0 (QR codes for Zaps)
- vite@4.4.0, @vitejs/plugin-react@4.0.0
- vite-plugin-pwa@0.16.4 (PWA support)

## Next Development Phase
1. Create NOSTR integration components
2. Build user authentication flow
3. Implement live note publishing
4. Add scheduled note feature
5. Integrate NOSTR Zap QR code display
6. Test on mobile

## How to Resume Development
1. Clone: `git clone https://github.com/chainclock123/chainclock.git`
2. Install: `cd chainclock && npm install --legacy-peer-deps`
3. Dev: `npm run dev` (runs on localhost:5173)
4. Deploy: `git push` (auto-deploys to Vercel)

## Design Notes
- BlockClock-inspired aesthetic (monospace font, minimal, Bitcoin-native)
- Dark mode primary, light mode toggle
- Real-time animations (pulse effect on block counter)
- NOSTR-native branding

## Contact/Attribution
- Creator: Anonymous (pseudonymous via NOSTR)
- Open Source: MIT License
- Community: NOSTR native, Bitcoin-focused
