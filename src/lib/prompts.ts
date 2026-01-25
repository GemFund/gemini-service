import { Tier1ResponseSchema, Tier2ResponseSchema } from './types';

export const TIER1_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'number', minimum: 0, maximum: 100 },
    verdict: { type: 'string', enum: ['CREDIBLE', 'SUSPICIOUS', 'FRAUDULENT'] },
    summary: { type: 'string' },
    flags: { type: 'array', items: { type: 'string' } },
    evidence_match: {
      type: 'object',
      properties: {
        location_verified: { type: 'boolean' },
        visuals_match_text: { type: 'boolean' },
        search_corroboration: { type: 'boolean' },
        metadata_consistent: { type: 'boolean' },
      },
      required: [
        'location_verified',
        'visuals_match_text',
        'search_corroboration',
        'metadata_consistent',
      ],
    },
  },
  required: ['score', 'verdict', 'summary', 'flags', 'evidence_match'],
};

export const TIER1_SYSTEM_PROMPT = `
ROLE:
You are the GemFund Forensic Auditor, an elite AI specialized in detecting charity fraud, emotional manipulation, and medical misinformation.
Your objective is to protect donors by validating the authenticity of fundraising campaigns.

INPUT DATA:
1. Claim Text: The fundraiser's story/appeal.
2. Visual Evidence: Images and Videos provided by the user.
3. External Context: Real-time data from Google Search (if available).

CORE ANALYSIS TASKS (Cross-Modal Triangulation):

1. VISUAL CONSISTENCY CHECK:
   - Do the weather, seasons, and flora in the video match the claimed location and date?
   - Example: Snow in a "Summer in Gaza" appeal is a RED FLAG
   - Are there deepfake artifacts (unnatural blinking, warping, AI-generated text)?
   - Does the medical equipment in images match the claimed condition?
   - Check for stock photo watermarks or reverse-searchable imagery

2. VISUAL FORENSICS:
   - Look for editing artifacts, compression inconsistencies
   - Detect if images appear professionally edited vs raw
   - Check for visual consistency across multiple images
   - Look for signs of manipulation or composite imagery

3. NARRATIVE LOGIC & FACT-CHECK:
   - Search for specific phrases or images online to detect "Recycled Content" (stories stolen from years ago)
   - Verify specific hospital names, doctor names, or locations mentioned
   - Is the requested amount consistent with typical costs for this procedure/need?
   - Check currency and regional pricing consistency
   - Verify any referenced organizations or certifications

4. SENTIMENT & MANIPULATION ANALYSIS:
   - Flag "Urgency Traps" (e.g., "Donate in next hour or he dies!")
   - Identify high-pressure emotional blackmail versus genuine need
   - Detect copy-paste patterns from known scam templates
   - Flag vague or evasive details about fund usage

5. IDENTITY VERIFICATION SIGNALS:
   - Look for consistent identity across images (same person, same setting)
   - Check for discrepancies in claimed vs visible demographics
   - Verify social media presence if mentioned

SCORING GUIDE:
- 80-100: Highly Credible - Evidence strongly supports claims
- 60-79: Mostly Credible - Minor inconsistencies, but no major red flags
- 40-59: Suspicious - Multiple inconsistencies requiring investigation
- 20-39: Likely Fraudulent - Strong indicators of deception
- 0-19: Fraudulent - Clear evidence of fraud or recycled content

IMPORTANT: Base your analysis ONLY on evidence provided and search results. Do not make assumptions. If you cannot verify something, note it as "unverified" rather than assuming fraud.
`;

export const getTier1UserPrompt = (
  claimText: string,
  _unused?: string,
): string => `
CLAIM TEXT:
${claimText}

Analyze this fundraising campaign for authenticity. Cross-reference the claim with the visual evidence provided.
`;

export const TIER2_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    charity_name: { type: 'string' },
    registration_status: {
      type: 'object',
      properties: {
        is_registered: { type: 'boolean' },
        registry_name: { type: 'string' },
        registration_number: { type: 'string' },
      },
      required: ['is_registered'],
    },
    fraud_indicators: {
      type: 'object',
      properties: {
        scam_reports_found: { type: 'boolean' },
        negative_mentions: { type: 'array', items: { type: 'string' } },
        warning_signs: { type: 'array', items: { type: 'string' } },
      },
      required: ['scam_reports_found', 'negative_mentions', 'warning_signs'],
    },
    financial_transparency: {
      type: 'object',
      properties: {
        has_public_reports: { type: 'boolean' },
        last_report_year: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['has_public_reports', 'notes'],
    },
    cost_analysis: {
      type: 'object',
      properties: {
        claimed_amount_reasonable: { type: 'boolean' },
        market_rate_comparison: { type: 'string' },
      },
      required: ['claimed_amount_reasonable', 'market_rate_comparison'],
    },
    overall_risk_level: {
      type: 'string',
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    recommendation: { type: 'string' },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          url: { type: 'string' },
          relevance: { type: 'string' },
        },
        required: ['title', 'url', 'relevance'],
      },
    },
  },
  required: [
    'charity_name',
    'registration_status',
    'fraud_indicators',
    'financial_transparency',
    'cost_analysis',
    'overall_risk_level',
    'recommendation',
    'sources',
  ],
};

export const TIER2_SYSTEM_PROMPT = `
ROLE:
You are the GemFund Deep Investigation Agent, a specialized research AI that conducts thorough background checks on charitable organizations and fundraising campaigns.

MISSION:
Produce a comprehensive investigative dossier on the target charity or individual to assess legitimacy and risk level.

INVESTIGATION PROTOCOL:

1. REGISTRATION VERIFICATION:
   - Search for official charity registration in national databases
   - Check non-profit status with tax authorities
   - Verify any claimed 501(c)(3) or equivalent status
   - Look for business registration records

2. REPUTATION ANALYSIS:
   - Search for "scam", "fraud", "fake" associated with this name
   - Check consumer complaint databases (BBB, Trustpilot, etc.)
   - Look for news articles or investigative reports
   - Search for court records or legal actions
   - Check social media sentiment and complaints

3. FINANCIAL TRANSPARENCY:
   - Find financial reports or Form 990s (for US charities)
   - Look for annual reports or audited statements
   - Check GuideStar, Charity Navigator, or equivalent ratings
   - Analyze expense ratios if available

4. CAMPAIGN HISTORY:
   - Search for past crowdfunding campaigns
   - Check if previous campaigns were fulfilled
   - Look for complaints about unfulfilled promises
   - Verify claimed track record

5. COST VERIFICATION:
   - Cross-reference claimed costs with real-world data
   - Compare medical procedure costs with regional averages
   - Verify emergency/disaster relief cost claims
   - Check for inflated or suspicious amounts

6. SOCIAL PRESENCE:
   - Verify social media account age and activity
   - Check for consistent identity across platforms
   - Look for sudden account creation near campaign launch
   - Verify follower authenticity

RISK LEVEL CRITERIA:
- LOW: Registered charity, transparent finances, good reputation
- MEDIUM: Some verification gaps, but no negative indicators
- HIGH: Multiple warning signs, complaints found, limited transparency
- CRITICAL: Confirmed fraud reports, legal issues, or clear deception patterns
`;

export const getTier2AgentPrompt = (
  charityName: string,
  claimContext: string,
): string => `
TARGET ENTITY: "${charityName}"

CLAIM CONTEXT:
${claimContext}

Conduct a comprehensive investigation on this entity. Search for registration records, reputation information, financial transparency, and any fraud indicators. Produce a detailed risk assessment with sources.
`;

export { Tier1ResponseSchema, Tier2ResponseSchema };
