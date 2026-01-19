# GemFund Forensic Engine API

AI-powered charity fraud detection service using Gemini AI.

## Base URL

```
https://gemfund-gemini-service.<Don't know yet>.workers.dev
```

## Authentication

All API endpoints require a valid Supabase JWT token in the Authorization header.

```
Authorization: Bearer <your-jwt-token>
```

## API Documentation

Interactive API docs available at `/docs`

## Endpoints

### 1. Assess Campaign (Tier 1)

Rapid fraud detection for fundraising campaigns.

**POST** `/api/v1/assess`

#### Request

```json
{
  "text": "Help save my child who needs urgent heart surgery. We need $50,000.",
  "media": [
    { "path": "campaigns/123/photo.jpg", "type": "image" },
    { "path": "campaigns/123/video.mp4", "type": "video" }
  ]
}
```

| Field          | Type   | Required | Description                                |
| -------------- | ------ | -------- | ------------------------------------------ |
| `text`         | string | Yes      | Campaign description (min 10 chars)        |
| `media`        | array  | No       | Array of media items from Supabase Storage |
| `media[].path` | string | Yes      | Path to file in Supabase Storage           |
| `media[].type` | string | Yes      | Either `image` or `video`                  |

#### Response

```json
{
  "success": true,
  "tier": 1,
  "data": {
    "score": 72,
    "verdict": "CREDIBLE",
    "summary": "Claim appears legitimate with minor inconsistencies",
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

| Field                | Description                                      |
| -------------------- | ------------------------------------------------ |
| `score`              | 0-100 credibility score (higher = more credible) |
| `verdict`            | `CREDIBLE`, `SUSPICIOUS`, or `FRAUDULENT`        |
| `deep_investigation` | `RECOMMENDED` if score < 50, else `OPTIONAL`     |

---

### 2. Start Investigation (Tier 2)

Start a deep background investigation on a charity.

**POST** `/api/v1/investigate`

#### Request

```json
{
  "charity_name": "Hearts for Children Foundation",
  "claim_context": "Fundraising for pediatric heart surgeries"
}
```

#### Response

```json
{
  "success": true,
  "interaction_id": "interaction_abc123",
  "status": "processing",
  "message": "Investigation started. Poll the status endpoint to check progress."
}
```

---

### 3. Check Investigation Status

Poll for investigation results.

**POST** `/api/v1/investigate/status`

#### Request

```json
{
  "interaction_id": "interaction_abc123"
}
```

#### Response (Processing)

```json
{
  "success": true,
  "interaction_id": "interaction_abc123",
  "status": "processing"
}
```

#### Response (Completed)

```json
{
  "success": true,
  "interaction_id": "interaction_abc123",
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
    "recommendation": "Organization appears legitimate",
    "sources": [
      {
        "title": "Charity Navigator",
        "url": "https://charitynavigator.org/...",
        "relevance": "Official charity rating"
      }
    ]
  }
}
```

| Status       | Description                   |
| ------------ | ----------------------------- |
| `processing` | Investigation in progress     |
| `completed`  | Results ready in `data` field |
| `failed`     | Investigation failed          |

---

## Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## Score Guide

| Score  | Verdict    | Action                         |
| ------ | ---------- | ------------------------------ |
| 80-100 | CREDIBLE   | Safe to donate                 |
| 60-79  | CREDIBLE   | Minor concerns, review flags   |
| 40-59  | SUSPICIOUS | Recommend Tier 2 investigation |
| 20-39  | FRAUDULENT | High risk, avoid               |
| 0-19   | FRAUDULENT | Clear fraud indicators         |

## Risk Levels (Tier 2)

| Level    | Description                              |
| -------- | ---------------------------------------- |
| LOW      | Registered, transparent, good reputation |
| MEDIUM   | Some gaps, no negative indicators        |
| HIGH     | Multiple warning signs found             |
| CRITICAL | Confirmed fraud reports or legal issues  |
