const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI ANALYSIS SERVICE (Google Gemini - FREE)
 * Free tier: 15 req/min, 1M tokens/day
 * Get key: https://aistudio.google.com/app/apikey
 */

async function analyzeSignalsWithClaude(competitorName, rawSignals) {
  // Function name kept same so no other files need changing

  if (!rawSignals || rawSignals.length === 0) {
    return {
      companies: [],
      summary: `No public signals found for companies using ${competitorName}.`,
      insights: ['Try searching for a more well-known competitor name.']
    };
  }

  const signalText = rawSignals
    .slice(0, 40)
    .map((s, i) => `[${i + 1}] SOURCE: ${s.source.toUpperCase()}\nEVIDENCE: ${s.evidence}\nURL: ${s.url}`)
    .join('\n\n---\n\n');

  const prompt = `You are a competitive intelligence analyst. I've scraped public signals about companies that use "${competitorName}".

Analyze these signals and extract:
1. Which SPECIFIC COMPANIES appear to use ${competitorName}
2. Confidence level for each (0-100)
3. What the evidence suggests about their use case

RAW SIGNALS:
${signalText}

Respond ONLY with valid JSON in this exact format (no markdown, no backticks, just raw JSON):
{
  "companies": [
    {
      "name": "Company Name",
      "source": "g2_review",
      "evidence": "One sentence explaining why we think they use ${competitorName}",
      "confidence": 75,
      "useCase": "Brief description of how they seem to use it"
    }
  ],
  "summary": "2-3 sentence executive summary of the competitive landscape",
  "insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ],
  "topSegments": ["segment1", "segment2"]
}

Rules:
- Only include companies where confidence > 40%
- Deduplicate same company (keep highest confidence)
- Skip signals with no extractable company name
- Max 30 companies
- Evidence field: 1 sentence max`;

  try {
    console.log('🤖 Sending signals to Gemini for analysis...');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Strip any markdown fences if Gemini adds them
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini did not return valid JSON');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ Gemini extracted ${parsed.companies?.length || 0} companies`);
    return parsed;

  } catch (err) {
    console.error('Gemini analysis error:', err.message);
    return {
      companies: rawSignals.slice(0, 10).map(s => ({
        name: s.companyName || 'Unknown',
        source: s.source,
        evidence: (s.evidence || '').substring(0, 150),
        confidence: s.confidence || 50,
        useCase: 'AI analysis unavailable'
      })).filter(c => c.name !== 'Unknown'),
      summary: `Found ${rawSignals.length} public mentions of ${competitorName}. AI analysis failed.`,
      insights: ['AI analysis failed. Raw signals shown above.'],
      topSegments: []
    };
  }
}

module.exports = { analyzeSignalsWithClaude };