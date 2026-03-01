const axios = require('axios');
const cheerio = require('cheerio');

/**
 * SCRAPER SERVICE
 * Gathers public signals about competitor usage from:
 * 1. G2 Reviews
 * 2. Job postings (via LinkedIn public + Indeed)
 * 3. HackerNews
 * 4. Reddit
 * 5. GitHub README files
 */

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch G2 reviews mentioning the competitor
 */
async function scrapeG2Reviews(competitorName) {
  const signals = [];
  try {
    const slug = competitorName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.g2.com/products/${slug}/reviews`;
    
    const response = await axios.get(url, { 
      headers: HEADERS, 
      timeout: 10000 
    });
    const $ = cheerio.load(response.data);

    // Extract reviewer company names and review text
    $('[itemprop="review"]').each((i, el) => {
      const reviewerTitle = $(el).find('[data-test-id="author-info-company"]').text().trim();
      const reviewText = $(el).find('[itemprop="reviewBody"]').text().trim().substring(0, 300);
      const reviewerName = $(el).find('[itemprop="author"]').text().trim();

      if (reviewerTitle && reviewerTitle.length > 2) {
        signals.push({
          source: 'g2_review',
          companyName: extractCompany(reviewerTitle),
          evidence: `${reviewerName} from ${reviewerTitle}: "${reviewText}"`,
          url: url,
          confidence: 85
        });
      }
    });

    console.log(`G2: Found ${signals.length} signals for ${competitorName}`);
  } catch (err) {
    console.log(`G2 scrape failed: ${err.message}`);
  }
  return signals;
}

/**
 * Search HackerNews for companies mentioning the competitor
 */
async function scrapeHackerNews(competitorName) {
  const signals = [];
  try {
    // Use HN Algolia API (free, no key needed)
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(competitorName)}&tags=comment&hitsPerPage=30`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const hits = response.data.hits || [];

    for (const hit of hits) {
      const text = hit.comment_text || hit.story_text || '';
      const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 300);
      
      // Look for "we use X", "our team uses X", "switched to X" patterns
      const usagePatterns = [
        /we use/i, /our team uses/i, /we switched/i, /we migrated/i,
        /we rely on/i, /we've been using/i, /we're using/i
      ];
      
      const hasUsageSignal = usagePatterns.some(p => p.test(text));
      
      if (hasUsageSignal && cleanText.length > 50) {
        signals.push({
          source: 'hackernews',
          companyName: null, // Will be extracted by AI
          evidence: cleanText,
          url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          confidence: 50,
          rawText: cleanText
        });
      }
    }
    
    console.log(`HN: Found ${signals.length} signals for ${competitorName}`);
  } catch (err) {
    console.log(`HN scrape failed: ${err.message}`);
  }
  return signals;
}

/**
 * Search Reddit for companies mentioning the competitor
 */
async function scrapeReddit(competitorName) {
  const signals = [];
  try {
    const subreddits = ['sales', 'startups', 'SaaS', 'entrepreneur', 'marketing'];
    
    for (const sub of subreddits.slice(0, 3)) { // Limit to 3 to avoid rate limiting
      await sleep(1000);
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(competitorName)}&sort=relevance&limit=15`;
      
      const response = await axios.get(url, { 
        headers: { ...HEADERS, 'Accept': 'application/json' },
        timeout: 10000 
      });
      
      const posts = response.data?.data?.children || [];
      
      for (const post of posts) {
        const data = post.data;
        const text = (data.selftext || data.title || '').substring(0, 400);
        
        if (text.length > 50) {
          signals.push({
            source: 'reddit',
            companyName: null,
            evidence: `[r/${sub}] ${data.title}: ${text}`,
            url: `https://reddit.com${data.permalink}`,
            confidence: 45,
            rawText: text
          });
        }
      }
    }
    
    console.log(`Reddit: Found ${signals.length} signals for ${competitorName}`);
  } catch (err) {
    console.log(`Reddit scrape failed: ${err.message}`);
  }
  return signals;
}

/**
 * Search GitHub for repos mentioning the competitor in READMEs
 */
async function scrapeGitHub(competitorName) {
  const signals = [];
  try {
    // GitHub search API (60 requests/hour unauthenticated)
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(competitorName)}+in:readme&sort=stars&per_page=20`;
    
    const response = await axios.get(url, {
      headers: { 
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CompetitorIntelTool'
      },
      timeout: 10000
    });
    
    const repos = response.data.items || [];
    
    for (const repo of repos.slice(0, 10)) {
      if (repo.description && repo.full_name) {
        signals.push({
          source: 'github',
          companyName: null,
          evidence: `Repo: ${repo.full_name} - ${repo.description}`,
          url: repo.html_url,
          confidence: 40,
          rawText: repo.description
        });
      }
    }
    
    console.log(`GitHub: Found ${signals.length} signals for ${competitorName}`);
  } catch (err) {
    console.log(`GitHub scrape failed: ${err.message}`);
  }
  return signals;
}

/**
 * Scrape Capterra for reviews (similar to G2)
 */
async function scrapeCapterra(competitorName) {
  const signals = [];
  try {
    const searchUrl = `https://www.capterra.com/p/search/?q=${encodeURIComponent(competitorName)}`;
    
    const response = await axios.get(searchUrl, { 
      headers: HEADERS, 
      timeout: 10000 
    });
    const $ = cheerio.load(response.data);
    
    // Extract reviewer info
    $('.review-card, [data-testid="review"]').each((i, el) => {
      const reviewer = $(el).find('.reviewer-details, .reviewer-name').text().trim();
      const reviewText = $(el).find('.review-body, .review-text').text().trim().substring(0, 300);
      
      if (reviewer && reviewText) {
        signals.push({
          source: 'capterra',
          companyName: extractCompany(reviewer),
          evidence: `${reviewer}: "${reviewText}"`,
          url: searchUrl,
          confidence: 80
        });
      }
    });
    
    console.log(`Capterra: Found ${signals.length} signals for ${competitorName}`);
  } catch (err) {
    console.log(`Capterra scrape failed: ${err.message}`);
  }
  return signals;
}

/**
 * Helper: Try to extract company name from job title strings
 */
function extractCompany(text) {
  // Common patterns: "John Doe at Acme Corp", "VP Sales, Acme Corp"
  const atPattern = /at\s+(.+)/i;
  const commaPattern = /,\s*(.+)/;
  
  const atMatch = text.match(atPattern);
  if (atMatch) return atMatch[1].trim();
  
  const commaMatch = text.match(commaPattern);
  if (commaMatch) return commaMatch[1].trim();
  
  return text.trim();
}

/**
 * MAIN SCRAPER: Run all scrapers and combine results
 */
async function scrapeAllSources(competitorName) {
  console.log(`\n🔍 Starting scrape for: ${competitorName}`);
  
  const [g2, hn, reddit, github, capterra] = await Promise.allSettled([
    scrapeG2Reviews(competitorName),
    scrapeHackerNews(competitorName),
    scrapeReddit(competitorName),
    scrapeGitHub(competitorName),
    scrapeCapterra(competitorName)
  ]);

  const allSignals = [
    ...(g2.status === 'fulfilled' ? g2.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(reddit.status === 'fulfilled' ? reddit.value : []),
    ...(github.status === 'fulfilled' ? github.value : []),
    ...(capterra.status === 'fulfilled' ? capterra.value : [])
  ];

  console.log(`\n✅ Total raw signals collected: ${allSignals.length}`);
  return allSignals;
}

module.exports = { scrapeAllSources };
