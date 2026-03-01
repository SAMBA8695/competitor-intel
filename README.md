# 🔍 Competitor Intelligence Tool

> Find which companies use your competitors — built with MERN + Claude AI.
> Built as a portfolio project for a Forward-Deployed AI Engineering internship application at Huntd.

## What it does

1. You type a competitor name (e.g. "Gong", "HubSpot")
2. It scrapes **G2, Reddit, HackerNews, GitHub, Capterra** simultaneously
3. Claude AI analyzes the raw signals and extracts **real company names**
4. You get a dashboard with confidence scores, evidence, and **CSV export**

---

## Tech Stack

| Layer    | Tech                        |
|----------|-----------------------------|
| Frontend | React, React Router         |
| Backend  | Node.js, Express            |
| Database | MongoDB Atlas (free)        |
| AI       | Claude (Anthropic API)      |
| Scraping | Axios + Cheerio             |
| Deploy   | Vercel (FE) + Render (BE)   |

---

## Setup Guide (Step by Step)

### Prerequisites
- Node.js v18+ installed
- Git installed
- Free accounts on: MongoDB Atlas, Anthropic

---

### Step 1: Clone and install

```bash
git clone https://github.com/yourusername/competitor-intel.git
cd competitor-intel

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Get your API keys (all free)

#### A. MongoDB Atlas (Free Database)
1. Go to https://cloud.mongodb.com
2. Create a free account → New Project → Build a Database
3. Choose **M0 Free Tier** → Create
4. Add a database user (remember username + password)
5. In Network Access → Add IP Address → **Allow access from anywhere** (0.0.0.0/0)
6. In your cluster → Connect → Connect your application
7. Copy the connection string: `mongodb+srv://username:password@cluster.mongodb.net/`
8. Replace `<password>` with your actual password

#### B. Anthropic API Key (Claude)
1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to API Keys → Create Key
4. Copy the key (starts with `sk-ant-`)
5. ⚠️ Free tier gives you $5 credit — enough for hundreds of searches

---

### Step 3: Configure environment

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:
```
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster.mongodb.net/huntd-intel
ANTHROPIC_API_KEY=sk-ant-your-key-here
PORT=5000
NODE_ENV=development
```

---

### Step 4: Run the project

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
# You should see: ✅ MongoDB connected
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# Opens at http://localhost:3000
```

Now go to http://localhost:3000 and search for a competitor!

---

### Step 5: Test it

Try searching for: `Gong`

You should see:
1. Status tracker: Scraping → Analyzing → Done
2. AI-generated summary
3. Grid of companies with confidence scores
4. Filter by source (Reddit, HN, GitHub, etc.)
5. CSV export button

---

## Deploy for Free

### Backend → Render.com
1. Push code to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo → select `/backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add Environment Variables (same as .env)
7. Deploy → copy your Render URL

### Frontend → Vercel.com
1. Go to https://vercel.com → New Project
2. Import your GitHub repo → select `/frontend`
3. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend.onrender.com/api`
4. Deploy → your frontend goes live

---

## Project Structure

```
competitor-intel/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── .env.example           # Environment template
│   ├── models/
│   │   └── IntelligenceReport.js  # MongoDB schema
│   ├── routes/
│   │   ├── intelligence.js    # Search, status, report, export
│   │   └── results.js         # History + delete
│   └── services/
│       ├── scraper.js         # G2, Reddit, HN, GitHub, Capterra scrapers
│       └── aiAnalyzer.js      # Claude AI analysis
│
└── frontend/
    └── src/
        ├── App.js             # Router setup
        ├── App.css            # All styles (dark terminal theme)
        ├── components/
        │   ├── Navbar.js
        │   ├── CompanyCard.js    # Result card with confidence
        │   └── StatusTracker.js  # Live pipeline status
        ├── hooks/
        │   └── usePolling.js     # Status polling hook
        ├── pages/
        │   ├── Home.js          # Search page
        │   ├── Report.js        # Results + filters + export
        │   └── History.js       # Past searches
        └── utils/
            └── api.js           # Axios API calls
```

---

## How the AI pipeline works

```
User Input → Express API
     ↓
Create MongoDB Report (status: pending)
     ↓
Background Pipeline starts (non-blocking):
     ↓
scraper.js runs 5 scrapers in parallel:
  - G2 Reviews → company names from reviewer titles
  - HackerNews → "we use X" pattern matching
  - Reddit     → posts mentioning competitor
  - GitHub     → repos with competitor in README
  - Capterra   → reviewer company data
     ↓
aiAnalyzer.js sends all signals to Claude:
  - Extracts real company names
  - Assigns confidence scores (0-100)
  - Identifies use cases
  - Writes executive summary
     ↓
Results saved to MongoDB
     ↓
Frontend polls /status every 3s → fetches full report when done
```

---

## Key Engineering Decisions

| Decision | Reason |
|----------|--------|
| Non-blocking pipeline | User gets reportId immediately; scraping runs async |
| Polling instead of WebSockets | Simpler, works on free hosting tiers |
| Claude Haiku model | Cheapest + fast enough for this task |
| Parallel scrapers | Reduce total time from 30s to ~10s |
| CSV export server-side | Keeps client simple |

---

## Extending the project

Ideas to make it even better:
- Add **Playwright** for JavaScript-heavy sites that block Axios
- Add **SerpAPI** for Google search results
- Add **email alerts** when a search completes
- Add **Slack webhook** integration
- Build a **Chrome Extension** that runs intel on any LinkedIn profile

---

## License

MIT — build whatever you want with this.
