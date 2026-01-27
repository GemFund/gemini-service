# GemFund Forensic Engine API

AI-powered charity fraud detection service using Gemini AI. Deployed on VPS with Docker and NGINX.

## Base URL

| Environment | URL                         |
| ----------- | --------------------------- |
| Production  | `https://gemfund.apir.live` |
| Local       | `http://localhost:3000`     |

## Authentication

All `/api/*` endpoints require a valid Supabase JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

## Interactive API Docs

📚 **Scalar Docs:** `/docs`  
📄 **OpenAPI JSON:** `/doc`

---

## Endpoint

### Assess Campaign

Fraud detection using Gemini AI with Google Search grounding.

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

### Score Guide

| Score  | Verdict    | Recommendation       |
| ------ | ---------- | -------------------- |
| 80-100 | CREDIBLE   | Safe to donate       |
| 60-79  | CREDIBLE   | Minor concerns       |
| 40-59  | SUSPICIOUS | Review recommended   |
| 20-39  | FRAUDULENT | High risk, avoid     |
| 0-19   | FRAUDULENT | Clear fraud detected |

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

# Run locally (with wrangler)
bun run dev

# Run locally (standalone)
bun run start

# Build and run with Docker
docker compose up --build
```

### Environment Variables

Copy `.env.example` to `.env.prod` and fill in your values:

| Variable               | Description                       |
| ---------------------- | --------------------------------- |
| `SUPABASE_URL`         | Supabase project URL              |
| `SUPABASE_KEY`         | Supabase anon or service_role key |
| `SUPABASE_JWT_SECRET`  | JWT secret for token verification |
| `SUPABASE_BUCKET_NAME` | Storage bucket name               |
| `GEMINI_API_KEY`       | Google Gemini API key             |

---

## Deployment

Automated via GitHub Actions on push to `main`:

1. Builds Docker image with Bun
2. Pushes to Docker Hub (`aprapr/gemfund:latest`)
3. SSHs into VPS and runs `docker compose up -d`

### Required GitHub Secrets

| Secret                 | Description                |
| ---------------------- | -------------------------- |
| `VPS_IP`               | VPS IP address             |
| `SSH_PRIVATE_KEY`      | SSH key for VPS access     |
| `DOCKERHUB_USERNAME`   | Docker Hub username        |
| `DOCKERHUB_TOKEN`      | Docker Hub access token    |
| `SUPABASE_URL`         | Supabase project URL       |
| `SUPABASE_KEY`         | Supabase service role key  |
| `SUPABASE_JWT_SECRET`  | JWT verification secret    |
| `SUPABASE_BUCKET_NAME` | Storage bucket name        |
| `GEMINI_API_KEY`       | Google Gemini API key      |
| `SSL_CERT`             | Cloudflare Origin SSL cert |
| `SSL_KEY`              | Cloudflare Origin SSL key  |
