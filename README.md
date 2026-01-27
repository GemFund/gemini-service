# GemFund Forensic Engine

AI-powered fraud detection API for crypto-charity campaigns. Combines Gemini AI analysis with blockchain forensics, EXIF metadata, reverse image search, and identity OSINT.

## Quick Start

```bash
bun install && bun run start
```

**API Docs:** [https://gemfund.apir.live/docs](https://gemfund.apir.live/docs)

---

## API Reference

### Authentication

All `/api/*` endpoints require a Supabase JWT:

```http
Authorization: Bearer <jwt-token>
```

### `POST /api/v1/assess`

Analyze a fundraising campaign for fraud indicators.

**Request:**

```json
{
  "text": "Help save my child who needs heart surgery at Johns Hopkins.",
  "media": [{ "path": "campaigns/123/photo.jpg", "type": "image" }],
  "creatorAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f8d6b8",
  "donors": ["0xabc...", "0xdef..."],
  "creator": {
    "fullName": "John Doe",
    "username": "johndoe123",
    "email": "john@example.com"
  }
}
```

| Field            | Type     | Required | Description                              |
| ---------------- | -------- | -------- | ---------------------------------------- |
| `text`           | string   | ✓        | Campaign claim (min 10 chars)            |
| `media`          | array    |          | Media from Supabase Storage              |
| `creatorAddress` | string   |          | Ethereum wallet for blockchain analysis  |
| `donors`         | string[] |          | Donor wallets for wash trading detection |
| `creator`        | object   |          | Creator identity for OSINT investigation |

**Response:**

```json
{
  "success": true,
  "data": {
    "score": 72,
    "verdict": "CREDIBLE",
    "summary": "Campaign verified. Hospital exists.",
    "flags": ["hospital_verified"],
    "evidence_match": { ... }
  },
  "forensics": {
    "blockchain": { "nonce": 42, "ageHours": 720, "isBurnerWallet": false },
    "exif": { "hasGps": true, "hasEdits": false },
    "reverseImage": { "duplicatesFound": 0, "isStockPhoto": false },
    "identity": {
      "platformsFound": 5,
      "scamReportsFound": false,
      "isDisposableEmail": false,
      "identityConsistent": true,
      "accountAge": "established",
      "trustScore": 75,
      "redFlags": [],
      "greenFlags": ["linkedin_verified"]
    }
  }
}
```

---

## Forensic Analysis

### Hard Metrics (Objective)

| Check            | Threshold           | Result     |
| ---------------- | ------------------- | ---------- |
| Wash Trading     | >20%                | FRAUD      |
| Burner Wallet    | age <24h + nonce <5 | HIGH RISK  |
| Stock Photo      | detected            | FRAUD      |
| Scam Reports     | found               | HIGH RISK  |
| Disposable Email | detected            | SUSPICIOUS |

### Identity OSINT (Google Dorking)

- Social media presence (Twitter, LinkedIn, GitHub, Instagram)
- Scam/fraud report searches
- Disposable email detection
- Cross-platform identity consistency
- Account age analysis

### Soft Metrics (AI-Analyzed)

- Visual consistency with claims
- EXIF metadata (GPS, timestamps, editing)
- Narrative logic and fact-checking
- Urgency manipulation detection

---

## Scoring System

| Score  | Verdict      | Meaning                |
| ------ | ------------ | ---------------------- |
| 80-100 | `CREDIBLE`   | All checks pass        |
| 60-79  | `CREDIBLE`   | Minor issues only      |
| 40-59  | `SUSPICIOUS` | Soft metric failures   |
| 20-39  | `FRAUDULENT` | Hard metric failures   |
| 0-19   | `FRAUDULENT` | Multiple hard failures |

---

## Environment Variables

| Variable               | Description               |
| ---------------------- | ------------------------- |
| `GEMINI_API_KEY`       | Google Gemini API key     |
| `SUPABASE_URL`         | Supabase project URL      |
| `SUPABASE_KEY`         | Supabase service role key |
| `SUPABASE_JWT_SECRET`  | JWT verification secret   |
| `SUPABASE_BUCKET_NAME` | Storage bucket name       |
| `ETHERSCAN_API_KEY`    | Etherscan API key         |
| `SERPAPI_API_KEY`      | SerpAPI key               |

---

## Deployment

```
push to main → build → Docker Hub → deploy to VPS
```

```bash
docker compose up --build -d
```

---

## Supported Media

| Type  | Formats              |
| ----- | -------------------- |
| Image | JPEG, PNG, WebP, GIF |
| Video | MP4, WebM, MOV       |

---

**License:** MIT
