# GemFund Forensic Engine API

AI-powered charity fraud detection service using Gemini AI. Deployed on Cloudflare Workers.

## Base URL

| Environment | URL                                                               |
| ----------- | ----------------------------------------------------------------- |
| Production  | `https://gemfund-gemini-service.echa-apriliyanto-dev.workers.dev` |
| Local       | `http://localhost:8787`                                           |

## Authentication

All `/api/*` endpoints require a valid Supabase JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

## Interactive API Docs

📚 **Scalar Docs:** `/docs`  
📄 **OpenAPI JSON:** `/doc`

---

## Endpoints

### 1. Assess Campaign (Tier 1)

Rapid fraud detection using Gemini AI with Google Search grounding.

```http
POST /api/v1/assess
```

#### Request Body

```json
{
  "text": "Help save my child who needs urgent heart surgery at Johns Hopkins. We need $50,000 by Friday!",
  "media": [
    { "path": "campaigns/123/photo.jpg", "type": "image" },
    { "path": "campaigns/123/video.mp4", "type": "video" }
  ]
}
```

| Field          | Type   | Required | Description                        |
| -------------- | ------ | -------- | ---------------------------------- |
| `text`         | string | Yes      | Campaign claim text (min 10 chars) |
| `media`        | array  | No       | Media files from Supabase Storage  |
| `media[].path` | string | Yes      | Path relative to bucket root       |
| `media[].type` | string | Yes      | `image` or `video`                 |

> **Media Handling:** Paths are converted to signed URLs and passed directly to Gemini AI.

#### Success Response (200)

```json
{
  "success": true,
  "tier": 1,
  "data": {
    "score": 72,
    "verdict": "CREDIBLE",
    "summary": "Campaign appears legitimate. Hospital verified. Costs align with regional averages.",
    "flags": ["hospital_verified", "cost_reasonable"],
    "evidence_match": {
      "location_verified": true,
      "visuals_match_text": true,
      "search_corroboration": true,
      "metadata_consistent": true
    }
  },
  "deep_investigation": "OPTIONAL"
}
```

---

### 2. Start Investigation (Tier 2)

Initiates async deep research using Gemini AI agents.

```http
POST /api/v1/investigate
```

#### Request Body

```json
{
  "charity_name": "Hearts for Children Foundation",
  "claim_context": "Fundraising for pediatric heart surgeries in developing countries"
}
```

#### Success Response (202)

```json
{
  "success": true,
  "interaction_id": "interaction_abc123xyz",
  "status": "processing",
  "message": "Investigation started. Poll the status endpoint to check progress."
}
```

> **Processing Time:** 30 seconds to 10 minutes

---

### 3. Check Investigation Status

Poll for investigation results.

```http
POST /api/v1/investigate/status
```

#### Request Body

```json
{
  "interaction_id": "interaction_abc123xyz"
}
```

#### Response - Processing (202)

```json
{
  "success": true,
  "interaction_id": "interaction_abc123xyz",
  "status": "processing"
}
```

#### Response - Completed (200)

```json
{
  "success": true,
  "interaction_id": "interaction_abc123xyz",
  "status": "completed",
  "data": {
    "charity_name": "Hearts for Children Foundation",
    "registration_status": {
      "is_registered": true,
      "registry_name": "IRS 501(c)(3)",
      "registration_number": "12-3456789"
    },
    "fraud_indicators": {
      "scam_reports_found": false,
      "negative_mentions": [],
      "warning_signs": []
    },
    "financial_transparency": {
      "has_public_reports": true,
      "last_report_year": 2025,
      "notes": "Annual reports available on website"
    },
    "cost_analysis": {
      "claimed_amount_reasonable": true,
      "market_rate_comparison": "Costs align with regional averages"
    },
    "overall_risk_level": "LOW",
    "recommendation": "Organization appears legitimate. Safe to donate.",
    "sources": [
      {
        "title": "Charity Navigator",
        "url": "https://charitynavigator.org/...",
        "relevance": "Official charity rating"
      }
    ]
  },
  "raw_output": "..."
}
```

---

## Error Responses

All errors return:

```json
{
  "success": false,
  "error": "Error message"
}
```

| Status | Description            |
| ------ | ---------------------- |
| 400    | Validation error       |
| 401    | Missing or invalid JWT |
| 500    | Internal server error  |

---

## Reference Tables

### Score Guide (Tier 1)

| Score  | Verdict    | Recommendation                 |
| ------ | ---------- | ------------------------------ |
| 80-100 | CREDIBLE   | Safe to donate                 |
| 60-79  | CREDIBLE   | Minor concerns, review flags   |
| 40-59  | SUSPICIOUS | Deep investigation recommended |
| 20-39  | FRAUDULENT | High risk, avoid               |
| 0-19   | FRAUDULENT | Clear fraud indicators         |

### Risk Levels (Tier 2)

| Level    | Description                                    |
| -------- | ---------------------------------------------- |
| LOW      | Registered, transparent, good reputation       |
| MEDIUM   | Some verification gaps, no negative indicators |
| HIGH     | Multiple warning signs found                   |
| CRITICAL | Confirmed fraud reports or legal issues        |

### Supported Media

| Type  | Extensions                               |
| ----- | ---------------------------------------- |
| Image | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif` |
| Video | `.mp4`, `.webm`, `.mov`                  |

---

## Development

```bash
# Install dependencies
bun install

# Run locally
bun run dev

# Deploy to Cloudflare
bun run deploy

# Update types
bun run cf-typegen
```

### Environment Variables

| Variable               | Description                       |
| ---------------------- | --------------------------------- |
| `SUPABASE_URL`         | Supabase project URL              |
| `SUPABASE_KEY`         | Supabase anon or service_role key |
| `SUPABASE_JWT_SECRET`  | JWT secret for token verification |
| `SUPABASE_BUCKET_NAME` | Storage bucket name               |
| `GEMINI_API_KEY`       | Google Gemini API key             |

Set secrets in Cloudflare:

```bash
bun wrangler secret put SUPABASE_KEY
bun wrangler secret put GEMINI_API_KEY
# etc.
```
