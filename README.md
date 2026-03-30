# LiquidRead

LiquidRead is an intelligent research calibration application designed to adapt dense academic papers into dynamic, personalised summaries (cards) based on the user's technical background, reading constraints, and goals. 

Powered by **Next.js** and **Gemini 2.5**, it reads peer-reviewed papers (via OpenAlex) and actively translates them without losing the core statistical findings or credibility.

## Getting Started

1. Set up your `.env.local`:
   \`\`\`
   GEMINI_API_KEY=your_key_here
   NEXT_PUBLIC_SHEET_URL=your_sheet_url_here
   \`\`\`

2. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
