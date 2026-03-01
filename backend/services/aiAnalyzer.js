const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function analyzeSignalsWithClaude(competitorName, rawSignals) {
  if (!rawSignals || rawSignals.length === 0) {
    return {
      companies: [],
      summary: `No public signals found for companies using ${competitorName}.`,
      insights: ['Try searching for a more well-known competitor name.']
    };
  }

  const signalText = rawSignals
    .slice(0, 30)
    .map((s, i) => `[${i + 1}] SOURCE: ${s.source.toUpperCase()}\nEVIDENCE: ${s.evidence}\nURL: ${s.url}`)
    .join('\n\n---\n\n');

  const prompt = `You are a competitive intelligence analyst. Analyze these public signals about companies using "${competitorName}".

RAW SIGNALS:
${signalText}

Respond ONLY with raw JSON (no markdown, no backticks, no explanation):
{
  "companies": [
    {
      "name": "Company Name",
      "source": "reddit",
      "evidence": "One sentence why they use ${competitorName}",
      "confidence": 75,
      "useCase": "How they use it"
    }
  ],
  "summary": "2-3 sentence executive summary",
  "insights": ["insight 1", "insight 2", "insight 3"],
  "topSegments": ["segment1", "segment2"]
}

Rules: confidence > 40% only, deduplicate companies, max 25, skip if no real company name found.`;

  try {
    console.log('🤖 Sending signals to Groq...');
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`✅ Groq extracted ${parsed.companies?.length || 0} companies`);
    return parsed;

  } catch (err) {
    console.error('Groq error:', err.message);
    return {
      companies: [],
      summary: `Found ${rawSignals.length} signals for ${competitorName}. AI analysis failed.`,
      insights: ['AI analysis failed. Try again.'],
      topSegments: []
    };
  }
}

module.exports = { analyzeSignalsWithClaude };