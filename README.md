# x402 Fullstack Boilerplate — Conflux eSpace

> Production-grade HTTP 402 Payment Required protocol implementation on Conflux eSpace.
> Multi-token, multi-method machine-to-machine payments.

[![CI](https://github.com/confluxarena/x402-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/confluxarena/x402-fullstack/actions)

## Overview

This boilerplate demonstrates the **x402 protocol** — a standardized way to monetize APIs using HTTP 402 responses. When a client requests a paid endpoint, the server responds with `402 Payment Required` along with machine-readable payment instructions. The client pays on-chain, then retries with proof of payment.

### Architecture

```
┌──────────────┐     HTTP 402      ┌──────────────┐      verify/settle     ┌──────────────┐
│              │ ──────────────►   │              │ ───────────────────►   │              │
│   Agent /    │                   │   Seller     │                        │  Facilitator │
│   Browser    │ ◄──────────────   │   (Hono)     │ ◄───────────────────   │              │
│              │     HTTP 200      │              │      result            │              │
└──────┬───────┘                   └──────┬───────┘                        └──────┬───────┘
       │                                  │                                       │
       │  pay on-chain                    │  log to DB                            │  relay TX
       ▼                                  ▼                                       ▼
┌──────────────┐                   ┌──────────────┐                        ┌──────────────┐
│  Conflux     │                   │ PostgreSQL   │                        │  Payment     │
│  eSpace      │                   │    16        │                        │  Contract    │
└──────────────┘                   └──────────────┘                        └──────────────┘
```

### Payment Methods

| Method | How it works | Tokens |
|--------|-------------|--------|
| **Native** | Direct CFX transfer to payment contract | CFX |
| **ERC-20** | `approve` + `transferFrom` via payment contract | USDT, USDC, BTC, ETH, AxCNH |
| **EIP-3009** | Gasless `transferWithAuthorization` (signed off-chain) | USDT0 |

### Supported Tokens

**Testnet (Chain 71)**
| Token | Address | Decimals | Method |
|-------|---------|----------|--------|
| CFX | Native | 18 | native |
| USDT | `0x7d682e65EFC5C13Bf4E394B8f376C48e6baE0355` | 18 | erc20 |
| USDC | `0x349298b0e20df67defd6efb8f3170cf4a32722ef` | 18 | erc20 |
| BTC | `0x54593e02c39aeff52b166bd036797d2b1478de8d` | 18 | erc20 |
| ETH | `0xcd71270f82f319e0498ff98af8269c3f0d547c65` | 18 | erc20 |

**Mainnet (Chain 1030)**
| Token | Address | Decimals | Method |
|-------|---------|----------|--------|
| CFX | Native | 18 | native |
| USDT0 | `0xaf37e8b6c9ed7f6318979f56fc287d76c30847ff` | 6 | eip3009 |
| USDT | `0xfe97e85d13abd9c1c33384e796f10b73905637ce` | 18 | erc20 |
| USDC | `0x6963efed0ab40f6c3d7bda44a05dcf1437c44372` | 18 | erc20 |
| AxCNH | `0x70bfd7f7eadf9b9827541272589a6b2bb760ae2e` | 6 | erc20 |

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16
- Docker & Docker Compose (optional)

### 1. Clone & Configure

```bash
git clone https://github.com/confluxarena/x402-fullstack.git
cd x402-fullstack
cp .env.example .env
# Edit .env with your keys
```

### 2. Docker Compose (recommended)

```bash
docker compose up -d
```

This starts:
- **PostgreSQL 16** on port 5432 (auto-runs `database/schema.sql`)
- **Facilitator** on port 3849
- **Seller API** on port 3850
- **Frontend** on port 3000

### 3. Manual Setup

```bash
# Database
psql -U x402 -d x402 -f database/schema.sql

# Facilitator
cd facilitator && npm install && npm run dev

# Seller (new terminal)
cd seller && npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev

# Open http://localhost:3000
```

### 4. Deploy Smart Contract

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network conflux-testnet
# Copy the deployed address to .env PAYMENT_CONTRACT_TESTNET
```

### 5. Run the Agent

```bash
cd agent
npm install
AGENT_PRIVATE_KEY=0x... npx tsx src/index.ts "What is Conflux?"
AGENT_PRIVATE_KEY=0x... npx tsx src/index.ts --token USDT "What is Conflux?"
```

## Project Structure

```
x402-fullstack/
├── seller/             # Hono API server with x402 middleware
│   └── src/
│       ├── config/     # Network/token config, database, env
│       ├── middleware/  # x402 payment middleware
│       ├── routes/     # /ai, /data, /health endpoints
│       └── index.ts    # Server entry point
├── facilitator/        # Payment verification & settlement
│   └── src/
│       ├── handlers/   # eip3009, erc20, native handlers
│       ├── config.ts   # ABIs and environment
│       └── index.ts    # HTTP server
├── frontend/           # Next.js 14 with Tailwind CSS
│   └── src/
│       ├── app/        # Pages: demo, history, admin, pay
│       ├── components/ # NetworkTabs, TokenSelector, WalletButton
│       └── lib/        # x402 client, wallet helpers, networks
├── agent/              # CLI agent for autonomous payments
│   └── src/index.ts    # 5-step payment flow
├── contracts/          # Solidity: X402PaymentReceiver
│   ├── contracts/      # .sol source
│   └── scripts/        # Hardhat deploy script
├── database/           # PostgreSQL 16 schema
├── .well-known/x402    # x402 discovery document
├── docker-compose.yml  # Full stack orchestration
└── .github/workflows/  # CI pipeline
```

## x402 Protocol Flow

```
1. Client → GET /ai?q=hello&token=CFX
2. Server → 402 Payment Required
   Headers:
     PAYMENT-REQUIRED: base64({x402Version:2, accepts:[{scheme,network,amount,asset,payTo,extra}]})
     X-Payment-Amount: 1000000000000000
     X-Payment-Token: 0x0000...
     X-Payment-Nonce: abc123
     X-Payment-Expiry: 1700000000
3. Client pays on-chain (native / approve+transferFrom / EIP-3009 signature)
4. Client → GET /ai?q=hello&token=CFX
   Headers:
     PAYMENT-SIGNATURE: base64({x402Version:2, scheme:"exact", network:"eip155:71", payload:{...}})
5. Seller → Facilitator: verify + settle
6. Facilitator → confirms on-chain, relays if needed
7. Server → 200 OK (response data)
```

## API Endpoints

### Seller (port 3850)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Server status and token list |
| GET | `/tokens` | None | Available tokens for current network |
| GET | `/ai?q=...&token=CFX` | x402 | AI query (paid) |
| GET | `/data/free` | None | Free data endpoint |
| GET | `/data/premium` | x402 | Premium data (paid) |

### Facilitator (port 3849)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/x402/health` | None | Facilitator status |
| POST | `/x402/verify-eip3009` | API Key | Verify EIP-3009 signature |
| POST | `/x402/settle-eip3009` | API Key | Settle EIP-3009 transfer |
| POST | `/x402/verify-erc20` | API Key | Verify ERC-20 allowance |
| POST | `/x402/settle-erc20` | API Key | Settle ERC-20 transfer |
| POST | `/x402/verify-native` | API Key | Verify native TX |
| POST | `/x402/settle-native` | API Key | Confirm native TX |

## Smart Contract

`X402PaymentReceiver.sol` — Receives payments and forwards to treasury.

**Functions:**
- `payNative(bytes32 invoiceId)` — Accept CFX, forward to treasury
- `payWithToken(address token, uint256 amount, bytes32 invoiceId)` — Accept ERC-20 via transferFrom
- `payWithAuthorization(...)` — Accept EIP-3009 gasless transfer (owner only)

**Events:**
- `PaymentReceived(invoiceId, payer, token, amount, paymentMethod)`

## Environment Variables

See [`.env.example`](.env.example) for all configuration options.

Key variables:
- `NETWORK` — `testnet` or `mainnet`
- `RELAYER_PRIVATE_KEY` — Wallet key for gas fees (facilitator)
- `TREASURY_ADDRESS` — Receives all payments
- `PAYMENT_CONTRACT_*` — Deployed contract addresses
- `CLAUDE_API_KEY` — For AI endpoint
- `FACILITATOR_KEY` — Shared secret between seller and facilitator

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Seller API | Hono + TypeScript + Node.js 20 |
| Facilitator | TypeScript + ethers.js 6 |
| Frontend | Next.js 14 + Tailwind CSS |
| Agent | TypeScript CLI + ethers.js 6 |
| Database | PostgreSQL 16 |
| Smart Contract | Solidity + Hardhat |
| Blockchain | Conflux eSpace (EVM) |
| CI/CD | GitHub Actions |
| Deploy | Docker Compose |

## License

MIT — See [LICENSE](LICENSE) for details.

---

Built for the [x402 Bounty](https://github.com/conflux-fans/conflux-bounties/issues/17) on Conflux eSpace.
