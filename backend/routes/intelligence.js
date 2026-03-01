const express = require('express');
const router = express.Router();
const IntelligenceReport = require('../models/IntelligenceReport');
const { scrapeAllSources } = require('../services/scraper');
const { analyzeSignalsWithClaude } = require('../services/aiAnalyzer');

/**
 * POST /api/intelligence/search
 * Start a new competitor intelligence search
 */
router.post('/search', async (req, res) => {
  const { competitorName } = req.body;
  
  if (!competitorName || competitorName.trim().length < 2) {
    return res.status(400).json({ error: 'Competitor name is required (min 2 chars)' });
  }

  const cleanName = competitorName.trim();

  try {
    // Create report in DB
    const report = new IntelligenceReport({
      competitorName: cleanName,
      status: 'pending'
    });
    await report.save();

    // Return report ID immediately (non-blocking)
    res.json({ 
      reportId: report._id,
      message: `Intelligence gathering started for "${cleanName}"`,
      status: 'pending'
    });

    // Run scraping + analysis in background
    runIntelligencePipeline(report._id, cleanName);
    
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to start search' });
  }
});

/**
 * Background pipeline: scrape → analyze → save
 */
async function runIntelligencePipeline(reportId, competitorName) {
  try {
    // Update status: scraping
    await IntelligenceReport.findByIdAndUpdate(reportId, { status: 'scraping' });
    
    // Step 1: Scrape all sources
    const rawSignals = await scrapeAllSources(competitorName);
    
    // Save raw signals
    await IntelligenceReport.findByIdAndUpdate(reportId, { 
      status: 'analyzing',
      rawSignals: rawSignals.map(s => ({
        source: s.source,
        content: s.evidence,
        url: s.url,
        scrapedAt: new Date()
      }))
    });

    // Step 2: Analyze with Claude
    const analysis = await analyzeSignalsWithClaude(competitorName, rawSignals);

    // Step 3: Save final results
    await IntelligenceReport.findByIdAndUpdate(reportId, {
      status: 'done',
      companies: analysis.companies || [],
      aiSummary: analysis.summary || '',
      aiInsights: analysis.insights || [],
      totalFound: (analysis.companies || []).length,
      completedAt: new Date()
    });

    console.log(`✅ Report ${reportId} complete. Found ${analysis.companies?.length || 0} companies.`);
    
  } catch (err) {
    console.error(`Pipeline error for report ${reportId}:`, err);
    await IntelligenceReport.findByIdAndUpdate(reportId, { 
      status: 'error',
      error: err.message 
    });
  }
}

/**
 * GET /api/intelligence/status/:reportId
 * Poll for report status
 */
router.get('/status/:reportId', async (req, res) => {
  try {
    const report = await IntelligenceReport.findById(req.params.reportId)
      .select('status totalFound competitorName createdAt completedAt error');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

/**
 * GET /api/intelligence/report/:reportId
 * Get full report with results
 */
router.get('/report/:reportId', async (req, res) => {
  try {
    const report = await IntelligenceReport.findById(req.params.reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * GET /api/intelligence/export/:reportId
 * Export results as CSV
 */
router.get('/export/:reportId', async (req, res) => {
  try {
    const report = await IntelligenceReport.findById(req.params.reportId);
    
    if (!report || report.status !== 'done') {
      return res.status(404).json({ error: 'Report not ready' });
    }
    
    // Build CSV
    const headers = 'Company Name,Source,Confidence,Evidence,Use Case\n';
    const rows = report.companies.map(c => 
      `"${c.name}","${c.source}","${c.confidence}%","${(c.evidence || '').replace(/"/g, '""')}","${(c.useCase || '').replace(/"/g, '""')}"`
    ).join('\n');
    
    const csv = headers + rows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report.competitorName}-intel-${Date.now()}.csv"`);
    res.send(csv);
    
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
