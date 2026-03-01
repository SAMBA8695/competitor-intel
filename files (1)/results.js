const express = require('express');
const router = express.Router();
const IntelligenceReport = require('../models/IntelligenceReport');

/**
 * GET /api/results
 * Get all past reports (for history)
 */
router.get('/', async (req, res) => {
  try {
    const reports = await IntelligenceReport.find()
      .select('competitorName status totalFound createdAt completedAt aiSummary')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * DELETE /api/results/:id
 * Delete a report
 */
router.delete('/:id', async (req, res) => {
  try {
    await IntelligenceReport.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
