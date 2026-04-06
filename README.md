# 🎓 PathForge — AI-Powered College Advising

**Real courses. Real clubs. Career prep college won't teach you.**
Personalized to your school and career goals.

![PathForge](https://img.shields.io/badge/Next.js-14-black) ![Claude](https://img.shields.io/badge/Claude_API-Sonnet_4-blue) ![Deploy](https://img.shields.io/badge/Deploy-Vercel-black)

---

## What It Does

PathForge builds a personalized 4-year college roadmap by:
- 🔍 **Searching your school's real course catalog** using AI + web search
- 📚 **Planning 8 semesters** of courses with direct links to your school's catalog
- ⚡ **Identifying what college won't teach you** — technical skills, networking playbooks, interview prep
- 🏛️ **Recommending clubs and organizations** with links to their pages
- 🎯 **Setting career milestones** semester by semester
- ✨ **Supporting custom career goals** — describe any career and get a tailored plan

## Deploy to Vercel (5 minutes)

### Step 1: Get an Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create an account and get an API key
3. Add credits ($5 is enough for hundreds of roadmap generations)

### Step 2: Push to GitHub
```bash
# Create a new repo on GitHub, then:
cd pathforge
git init
git add .
git commit -m "Initial PathForge app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pathforge.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"**
3. Import your `pathforge` repository
4. In **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your API key from Step 1
5. Click **Deploy**
6. Your site will be live at `https://pathforge.vercel.app` (or your custom domain)

### Step 4 (Optional): Custom Domain
1. In Vercel dashboard → Settings → Domains
2. Add your domain (e.g., `pathforge.com`)
3. Update DNS as instructed

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local
# Edit .env.local and add your ANTHROPIC_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
pathforge/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.js      # Server-side Claude API proxy
│   ├── globals.css            # Global styles
│   ├── layout.js              # Root layout with SEO
│   └── page.js                # Main page (client component)
├── components/
│   ├── BeyondClassroom.js     # "What college won't teach you" section
│   ├── CourseCard.js          # Individual course card
│   ├── Dashboard.js           # Main dashboard with all tabs
│   ├── LoadingScreen.js       # Loading animation
│   └── OnboardingFlow.js      # Name → Career → School flow
├── lib/
│   └── constants.js           # Career options and type colors
├── public/                    # Static assets
├── .env.example               # Environment variable template
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies
├── vercel.json                # Vercel deployment config
└── README.md                  # This file
```

## Cost Estimate

Each roadmap generation costs approximately **$0.05–$0.15** in Claude API usage.
- 1,000 users generating 1 roadmap each ≈ $50–$150
- With caching (same school + career), costs drop significantly

## Future Roadmap

- [ ] User authentication (save roadmaps)
- [ ] Database storage (Supabase/PlanetScale)
- [ ] PDF export of roadmaps
- [ ] Caching layer for repeated school+career combos
- [ ] Mobile app (React Native or PWA)
- [ ] Stripe payments for premium tier
- [ ] Community features (share roadmaps)
- [ ] Professor/advisor ratings integration

## Tech Stack

- **Frontend**: Next.js 14, React 18
- **AI**: Claude Sonnet 4 via Anthropic API
- **Search**: Claude's built-in web search tool
- **Hosting**: Vercel (serverless)
- **Styling**: Inline styles with CSS variables

---

Built with 🧠 by PathForge
