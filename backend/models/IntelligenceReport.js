const mongoose = require('mongoose');

const CompanySignalSchema = new mongoose.Schema({
  name: String,
  source: String,         // 'job_posting', 'g2_review', 'linkedin', 'news'
  evidence: String,       // What text proves they use the competitor
  confidence: Number,     // 0-100
  url: String,
  foundAt: { type: Date, default: Date.now }
});

const IntelligenceReportSchema = new mongoose.Schema({
  competitorName: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'scraping', 'analyzing', 'done', 'error'],
    default: 'pending'
  },
  companies: [CompanySignalSchema],
  rawSignals: [{
    source: String,
    content: String,
    url: String,
    scrapedAt: Date
  }],
  aiSummary: String,
  aiInsights: [String],
  totalFound: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  error: String
});

module.exports = mongoose.model('IntelligenceReport', IntelligenceReportSchema);
