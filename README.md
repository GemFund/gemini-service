<div align="center">

# GemFund Forensic Engine

### AI-Powered Fraud Detection for Crypto-Charity Campaigns

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Hono](https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![Gemini](https://img.shields.io/badge/Gemini_3-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

**Combat algorithmic fraud with algorithmic defense.**

[Live Demo](https://gemfund.apir.live/docs) · [Documentation](./docs/walkthrough/README.md) · [API Reference](#api-reference)

</div>

---

## 🎯 The Problem

The rise of Generative AI has **industrialized fraud**. Malicious actors now leverage AI to:

- 🎭 Generate **emotionally manipulative narratives** in native-level prose
- 🖼️ Create **photorealistic deepfakes** of non-existent people and prototypes
- 💰 Build **synthetic identities** that pass traditional KYC checks
- 🔄 Execute **wash trading** schemes with circular wallet funding

Traditional rule-based detection systems are helpless against generative fraud where **every attack is unique**.

---

## 💡 The Solution

GemFund Forensic Engine is a **Multi-Agent Forensic System** that fights AI fraud with AI defense. It combines:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              📱 CAMPAIGN SUBMISSION                          │
│         { text, media[], creatorAddress, donors[], creator }                │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              🔐 API GATEWAY                                  │
│                    JWT Verification → Input Validation                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                 ┌─────────────────────┼─────────────────────┐
                 │                     │                     │
                 ▼                     ▼                     ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│  ⛓️ BLOCKCHAIN         │ │  🖼️ VISUAL             │ │  👤 IDENTITY           │
│  FORENSICS            │ │  FORENSICS            │ │  OSINT                │
│  ─────────────────    │ │  ─────────────────    │ │  ─────────────────    │
│  • Wallet Age/Nonce   │ │  • EXIF Metadata      │ │  • Social Media       │
│  • Wash Trading       │ │  • GPS & Edit Detect  │ │  • Scam Reports       │
│  • Burner Detection   │ │  • Reverse Image      │ │  • Email Analysis     │
│                       │ │  • Stock Photo Check  │ │  • Google Dorking     │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
                 │                     │                     │
                 └─────────────────────┼─────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🤖 AI JUDGMENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Gemini 3 Flash                               │   │
│  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │   │
│  │  │ System       │     │ Google       │     │ Structured   │        │   │
│  │  │ Prompt       │ ──▶ │ Search       │ ──▶ │ JSON Output  │        │   │
│  │  │ + Forensics  │     │ Grounding    │     │ (Zod Parse)  │        │   │
│  │  └──────────────┘     └──────────────┘     └──────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              📊 VERDICT                                      │
│       Score (0-100) • CREDIBLE / SUSPICIOUS / FRAUDULENT • Evidence         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🔗 **Blockchain Forensics** | Detect burner wallets (age < 24h, nonce < 5) and wash trading patterns |
| 📸 **EXIF Analysis** | Extract GPS, timestamps, and detect photo editing software |
| 🔍 **Reverse Image Search** | Identify stock photos and duplicate images via Google Lens |
| 👤 **Identity OSINT** | Cross-platform social verification with scam report detection |
| 🧠 **AI Judgment** | Gemini 3 Flash with real-time Google Search grounding |
| 🛡️ **Prompt Injection Defense** | Built-in protection against manipulation attempts |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- API Keys: Gemini, Supabase, Etherscan, SerpAPI

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gemfund-gemini-service.git
cd gemfund-gemini-service

# Install dependencies
bun install

# Configure environment
cp .env.example .env

# Start development server
bun run start
```

### Environment Variables

```bash
# Required
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
SUPABASE_BUCKET_NAME=campaign-media

# Optional (enables additional forensics)
ETHERSCAN_API_KEY=your_etherscan_key
SERPAPI_API_KEY=your_serpapi_key
```

---

## 📖 API Reference

### Base URL

| Environment | URL |
|-------------|-----|
| Production  | `https://gemfund.apir.live` |
| Local       | `http://localhost:3000` |

### Authentication

All `/api/*` endpoints require a Supabase JWT:

```http
Authorization: Bearer <supabase_jwt_token>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/` | Health check |
| `GET`  | `/docs` | Interactive API documentation (Scalar UI) |
| `POST` | `/api/v1/assess` | Analyze campaign for fraud |

---

### `POST /api/v1/assess`

Perform comprehensive fraud analysis on a fundraising campaign.

#### Request

```json
{
  "text": "Help save my child who needs heart surgery at Johns Hopkins. We need $50,000!",
  "media": [
    { "path": "campaigns/123/medical_report.jpg", "type": "image" },
    { "path": "campaigns/123/hospital_video.mp4", "type": "video" }
  ],
  "creatorAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f8d6b8",
  "donors": ["0xabc...", "0xdef..."],
  "creator": {
    "fullName": "John Doe",
    "username": "johndoe123",
    "email": "john@example.com"
  }
}
```

| Field | Type | Required | Limits | Description |
|-------|------|----------|--------|-------------|
| `text` | string | ✓ | min 10 chars | Campaign description/claim |
| `media` | array | | max 10 | Media files from Supabase Storage |
| `creatorAddress` | string | | | Ethereum wallet for blockchain analysis |
| `donors` | array | | max 50 | Donor wallets for wash trading detection |
| `creator` | object | | | Creator identity for OSINT investigation |

#### Response

```json
{
  "success": true,
  "data": {
    "score": 72,
    "verdict": "CREDIBLE",
    "summary": "Campaign appears legitimate. Hospital verified via Google Search.",
    "flags": ["hospital_verified", "cost_reasonable"],
    "evidence_match": {
      "location_verified": true,
      "visuals_match_text": true,
      "search_corroboration": true,
      "metadata_consistent": true
    }
  },
  "forensics": {
    "blockchain": {
      "nonce": 42,
      "ageHours": 720,
      "washTradingScore": 0,
      "isBurnerWallet": false
    },
    "exif": {
      "hasGps": true,
      "hasEdits": false,
      "dateMismatch": false,
      "warnings": []
    },
    "reverseImage": {
      "duplicatesFound": 0,
      "isStockPhoto": false,
      "sources": []
    },
    "identity": {
      "platformsFound": 5,
      "scamReportsFound": false,
      "isDisposableEmail": false,
      "identityConsistent": true,
      "accountAge": "established",
      "trustScore": 75,
      "redFlags": [],
      "greenFlags": ["linkedin_verified", "github_active"]
    }
  }
}
```

---

## 🔬 Forensic Analysis Deep Dive

### Detection Strategy: Hard vs Soft Metrics

The system separates fraud indicators into two weighted categories:

| Type | Weight | Source | Reliability |
|------|--------|--------|-------------|
| **Hard Metrics** | 70% | Objective APIs | Deterministic, verifiable |
| **Soft Metrics** | 30% | AI Analysis | Probabilistic, contextual |

### Hard Metrics (Objective)

These are **automatic disqualifiers** when detected:

| Check | Threshold | Result | Detection Method |
|-------|-----------|--------|------------------|
| 🔄 Wash Trading | >20% donors funded by creator | **FRAUD** | Etherscan genesis tx analysis |
| 💀 Burner Wallet | age <24h AND nonce <5 | **HIGH RISK** | Etherscan wallet history |
| 📷 Stock Photo | Shutterstock/Getty detected | **FRAUD** | Google Lens via SerpAPI |
| ⚠️ Scam Reports | Found online | **HIGH RISK** | Google Search OSINT |
| 📧 Disposable Email | Temp mail detected | **SUSPICIOUS** | Email domain analysis |

### Soft Metrics (AI-Analyzed)

| Check | What It Detects |
|-------|----------------|
| 🖼️ Visual Consistency | Do images match the claimed location, season, and situation? |
| 📍 EXIF Metadata | GPS coordinates, timestamps, editing software traces |
| 📝 Narrative Logic | Fact-checking via Google Search (hospital names, costs, etc.) |
| 😢 Manipulation Detection | High-pressure emotional tactics ("Donate now or he dies!") |

### Identity OSINT (Google Dorking)

The system performs automated identity investigation:

```
✓ Social Media Presence    - Twitter, LinkedIn, GitHub, Instagram
✓ Scam History Search      - "username" + scam/fraud queries  
✓ Disposable Email Check   - Temp mail domain detection
✓ Cross-Platform Verify    - Identity consistency across platforms
✓ Account Age Analysis     - Established vs new accounts
```

---

## 📊 Scoring System

| Score | Verdict | Meaning | Action |
|-------|---------|---------|--------|
| 80-100 | `CREDIBLE` | All checks pass | ✅ Approve |
| 60-79 | `CREDIBLE` | Minor issues only | ✅ Approve with notes |
| 40-59 | `SUSPICIOUS` | Soft metric failures | ⚠️ Manual review |
| 20-39 | `FRAUDULENT` | Hard metric failures | ❌ Reject |
| 0-19 | `FRAUDULENT` | Multiple hard failures | ❌ Reject + Flag |

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | [Bun](https://bun.sh/) |
| Framework | [Hono](https://hono.dev/) |
| AI Engine | [Google Gemini 3 Flash](https://ai.google.dev/) |
| Validation | [Zod](https://zod.dev/) |
| Storage | [Supabase](https://supabase.com/) |
| Blockchain | [Etherscan API V2](https://etherscan.io/) |
| Image Search | [SerpAPI](https://serpapi.com/) (Google Lens) |
| EXIF | [exiftool-vendored](https://github.com/photostructure/exiftool-vendored) |

### Design Principles

1. **Fail-Open Pattern** - Single API failures don't block assessment
2. **Two-Step AI Analysis** - Free-form reasoning → Structured JSON
3. **Zero Trust** - Every claim is false until verified
4. **Parallel Forensics** - All checks run concurrently

### Project Structure

```
src/
├── index.ts                 # Application entry point
├── lib/
│   ├── config.ts           # Centralized configuration
│   ├── env.ts              # Environment variables
│   ├── errors.ts           # Custom error classes
│   ├── factory.ts          # Hono factory
│   ├── prompts.ts          # AI system prompts
│   ├── response.ts         # Response helpers
│   ├── routes.ts           # API routes
│   ├── types.ts            # TypeScript types
│   └── schemas/            # Zod validation schemas
├── middlewares/
│   ├── auth.ts             # JWT verification
│   └── init.ts             # Service initialization
└── services/
    ├── EtherscanService.ts # Blockchain forensics
    ├── ExifService.ts      # Metadata extraction
    ├── GeminiService.ts    # AI analysis
    ├── SerpService.ts      # Reverse image search
    └── SupabaseService.ts  # File storage
```

---

## 🐳 Deployment

### Docker

```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app

# Perl required for exiftool-vendored
RUN apk add --no-cache perl

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .
ENV NODE_ENV=production PORT=3000
EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

### Docker Compose

```bash
# Build and deploy
docker compose up --build -d
```

### CI/CD Pipeline

```
push to main → build → Docker Hub → deploy to VPS
```

---

## 📁 Supported Media

| Type | Formats | Max Items |
|------|---------|-----------|
| Image | JPEG, PNG, WebP, GIF | 10 |
| Video | MP4, WebM, MOV | 10 |

---

## 🔒 Security

- **JWT Authentication** on all `/api/*` routes
- **Input Validation** with Zod (array limits: 10 media, 50 donors)
- **Prompt Injection Defense** built into system prompts
- **Secret Management** via environment variables
- **Rate Limiting** with exponential backoff

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](./docs/walkthrough/architecture.md) | System design & data flow |
| [Forensic Modules](./docs/walkthrough/forensic-modules.md) | Deep dive into each detector |
| [AI Integration](./docs/walkthrough/ai-integration.md) | Gemini prompt engineering |
| [API Reference](./docs/walkthrough/api-reference.md) | Complete endpoint documentation |
| [Deployment](./docs/walkthrough/deployment.md) | Production deployment guide |
| [Security](./docs/walkthrough/security.md) | Security considerations |

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## 📄 License

MIT © GemFund

---

<div align="center">

**Built to protect the integrity of charitable giving in the Web3 era.**

</div>
