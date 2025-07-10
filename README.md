# 🦄 Memecoin Arbitrage Bot (Flashbots + SQLite + Frontend)

A full-stack MEV arbitrage bot optimized for memecoin opportunities. Features:

✅ Real-time DEX monitoring  
✅ Uniswap arbitrage profit simulator  
✅ Flashbots protected tx bundle  
✅ SQLite history record & frontend viewer  
✅ JSON/CSV export CLI

## 🔧 Setup

1. `npm install`
2. Create `.env`:

ALCHEMY_WSS_URL=wss://your-wss-url
ALCHEMY_HTTPS_URL=https://your-https-url
PRIVATE_KEY=0xYourPrivateKey

3. Start bot:

```bash
ts-node src/bot/listenSwap.ts

4. Export history:
ts-node scripts/exportHistory.ts csv


```
