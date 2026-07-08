# LiquidRead

> **Research papers, personalised to how you read.**

LiquidRead is an intelligent research calibration application that enables **epistemic personalisation of research papers through generative UI to help the curious stay up to date with the latest research**. It adapts dense academic papers into dynamic, personalised summaries based on the user's technical background, reading constraints, and goals. It fetches real peer-reviewed papers via **OpenAlex**, translates them through **Google Gemini 2.5**, and presents them at three calibrated depth levels — without losing the core statistical findings or credibility.

This README is the complete replication guide. It is written so that another team — developers, designers, researchers, or project managers — can rebuild this application from scratch.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Journey & Application Flow](#2-user-journey--application-flow)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Directory Structure](#5-directory-structure)
6. [Environment Variables & External Services](#6-environment-variables--external-services)
7. [Setup & Installation](#7-setup--installation)
8. [Component Reference](#8-component-reference)
9. [API Route Reference](#9-api-route-reference)
10. [Data Layer & Utilities](#10-data-layer--utilities)
11. [Scoring Algorithm](#11-scoring-algorithm)
12. [Design System & Visual Language](#12-design-system--visual-language)
13. [AI Prompt Engineering](#13-ai-prompt-engineering)
14. [Event Logging & Analytics](#14-event-logging--analytics)
15. [Deployment](#15-deployment)
16. [Role-Specific Replication Guides](#16-role-specific-replication-guides)
17. [Known Limitations & Future Work](#17-known-limitations--future-work)

---

## 1. Product Overview

### What it is

LiquidRead is a research-as-a-service prototype that acts as a personalised research feed. It discovers academic papers relevant to a user's field and interest, then generates three differently-calibrated summaries of the same paper:

- **Card A (Accessible)**: Plain-language storytelling. No jargon. Analogies and real-world framing. Targeted at readers who find academic papers difficult or unfamiliar.
- **Card B (Balanced)**: Technical findings with context. Statistics are included and explained. For readers comfortable with research but not specialists in the paper's domain.
- **Card C (Technical)**: Full academic depth. P-values, confidence intervals, methodology pipelines, and stated limitations. For researchers or advanced readers.

### What it does differently

Unlike tools that summarise papers generically, LiquidRead personalises the *presentation* — not just the content. The same paper is rendered differently depending on the user's:

- **Field of work** (determines which paper is fetched)
- **Research comfort level** (determines jargon density)
- **Reading goal** (determines framing and emphasis)
- **Available time** (determines word count per layer)
- **Trust anchor** (determines what appears first: source, finding, implication, or connection)
- **Confusion response style** (determines how much scaffolding to provide)
- **Specific research interest** (determines subfield-level paper discovery)

### Who it's for

The current prototype is designed as a research instrument (a study tool) — participants complete an onboarding quiz, receive a personalised paper card, read and interact with it, and then provide calibration feedback. The data collected (quiz answers, calibration signals, suitability ratings, open feedback) is stored in both Supabase (event log) and Google Sheets (survey payload).

---

## 2. User Journey & Application Flow

The app is a single-page application with a linear state machine. The complete user journey is:

### Phase 1: Onboarding (16 steps)

| Step | Type | Screen | Purpose |
|------|------|--------|---------|
| 0 | Welcome | `IntroScreen` | Landing screen. "Research, shaped to how you read." Introduces Ari (AI guide persona). |
| 1 | Demographics | `DemographicsScreen` (field) | "What field do you work or study in?" Options: Design, Engineering, Sciences, Social Sciences, Humanities, Medicine, Business. |
| 2 | Demographics | `DemographicsScreen` (comfort) | "How comfortable are you with academic papers?" 4-point scale from "I find it difficult" to "I read regularly without difficulty". |
| 3 | Demographics | `DemographicsScreen` (frequency) | "How often do you usually read research?" Options: Daily, A few times a week, A few times a month, Rarely. |
| 4 | Demographics | `DemographicsScreen` (priorName) | "Have you tested LiquidRead before?" Optional text input for returning participants. |
| 5 | Interstitial | `OnboardingInterstitial` | Context-setting pause: "LiquidRead doesn't just pick a paper. It changes how the paper opens for you." |
| 6 | Question | `QuestionCard` (q1) | Reading behaviour: what do you do when a paper gets complicated? (4 options, scored 0–2 points) |
| 7 | Question | `QuestionCard` (q2) | Reading preference: deep on one paper vs. scan many headlines? (2 options, scored 0–2 points) |
| 8 | Question | `QuestionCard` (q3) | Research discovery: active search vs. serendipity? (4 options, scored 0–2 points) |
| 9 | Question | `QuestionCard` (q4) | Reading goal: staying current, going deep, curiosity, or preparation? (4 options, scored 1–2 points) |
| 10 | Interstitial | `OnboardingInterstitial` | Second pause: "The same paper can feel totally different depending on how it's introduced." |
| 11 | Question | `QuestionCard` (q5) | Headline preference: plain language vs. technical vs. visual chart. Uses `visual-cards` layout with `SleepChartOption` SVG. (3 options, scored 0–3 points) |
| 12 | Question | `QuestionCard` (q6) | Time available: 5 min, 10–15 min, or 30+ min. (3 options, scored 0–3 points) |
| 13 | Question | `QuestionCard` (q7) | Tolerance for irrelevant recommendations. (3 options, scored 0–2 points) |
| 14 | Question | `QuestionCard` (q9) | Trust anchor: source, finding, implication, or connection? (4 options, 0 points each — used for personalisation only) |
| 15 | Question | `QuestionCard` (q8) | Free-text: "What's one topic you're curious about right now?" Stored as `field` in state. |
| 16 | Transition | Inline in `QuizApp` | "Got it. I'm shaping your first read." CTA: "Prepare my first read" → triggers scoring. |

**Ari Responses**: Every question screen includes a contextual AI guide response from "Ari" — a character badge (circular badge with letter "A") and italicised text that appears after the user selects an option. Each question has a mapping of `optionId → response string` defined in `ARI_RESPONSES` inside `QuizApp.tsx`. This makes the quiz feel conversational rather than transactional.

### Phase 2: Scoring & Card Generation

When the user clicks "Prepare my first read":

1. **Score calculation** (`lib/scoring.ts`): Sum all answer points (excluding q8 text), normalise to 0–10 scale.
2. **Card variant assignment**: Score ≤ 3.75 → Card A | Score ≤ 6.5 → Card B | Score > 6.5 → Card C.
3. **Session start event** logged to Supabase.
4. **Transition to feed view** (`FeedShell`).

### Phase 3: Paper Feed & Reading

The feed view presents:

1. **TopBar** with LiquidRead logo and hamburger menu (opens PersonaPanel).
2. **Tab bar** with "For You", "Impact", "Relevant" tabs (only "For You" is active).
3. **Functional paper card** (`FeedPaperCard`) — the real, AI-generated card. Shown with a loading skeleton while the API generates content.
4. **Placeholder cards** — three static, non-interactive preview cards suggesting future feed content.
5. **BottomNavBar** with Home, Bookmarks, Favorites icons.

When the functional card is tapped, the **ExpandedView** slides in as a full-screen reading experience:

- **Hook line** (AI-generated opening sentence)
- **Section-by-section content** with inline data visualisations (7 visual component types)
- **Comprehension quiz** (2 multiple-choice questions generated by Gemini)
- **Calibration feedback** ("Did this feel too basic, about right, or too advanced?")
- **Suitability rating** (1–5 scale)
- **Open feedback** text area
- **Adjacent card preview** (shows how the paper would look at one level simpler or more complex)
- **Recalibration** (if user says "too basic" or "too advanced", generates a new version at the adjusted level)

### Phase 4: Submission & Thank You

After feedback submission:

1. Payload submitted to Google Sheets via Apps Script webhook.
2. Survey marked as complete in localStorage (`mtp-survey-done`).
3. Progress state cleared from localStorage.
4. `ThankYou` screen displayed.

---

## 3. Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Next.js (App Router) | 16.1.6 | Server-side rendering, API routes, file-based routing |
| UI Library | React | 19.2.3 | Component-based UI |
| Language | TypeScript | ^5 | Type safety |
| CSS Framework | Tailwind CSS 4 | ^4 | Utility-first styling (via `@tailwindcss/postcss`) |
| CSS Processing | PostCSS | (bundled) | CSS transformation pipeline |
| AI Model | Google Gemini 2.5 Flash | API | Card generation, subfield selection, expanded view, recalibration |
| AI Model (Lite) | Gemini 2.5 Flash Lite | API | Subfield classification (lower cost, faster) |
| Paper Discovery | OpenAlex API | v1 | Open-access academic paper search and metadata |
| Full Text | NIH Entrez eFetch + Europe PMC | API | Full-text XML retrieval for PMC papers |
| Database | Supabase (PostgreSQL) | ^2.101.0 | Event logging and analytics |
| Data Collection | Google Sheets via Apps Script | Webhook | Survey payload storage |
| JSON Repair | jsonrepair | ^3.13.3 | Fixing malformed JSON from LLM responses |
| Deployment | Vercel | — | Hosting, serverless functions, CDN |
| Fonts | Google Fonts (DM Sans + Lora) | — | Typography: DM Sans for UI, Lora (serif) for editorial content |

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                                                             │
│  page.tsx → QuizApp (state machine)                         │
│    ├── IntroScreen          (step 0)                        │
│    ├── DemographicsScreen   (steps 1–4)                     │
│    ├── OnboardingInterstitial (steps 5, 10)                 │
│    ├── QuestionCard         (steps 6–9, 11–15)              │
│    ├── Transition screen    (step 16)                       │
│    └── FeedShell            (after scoring)                 │
│         ├── TopBar                                          │
│         ├── CardDisplay                                     │
│         │    ├── FeedPaperCard (functional + placeholders)   │
│         │    └── ExpandedView (full-screen reading)          │
│         │         ├── Visual components (7 types)           │
│         │         ├── Comprehension quiz                    │
│         │         ├── Calibration feedback                  │
│         │         └── Recalibration flow                    │
│         ├── BottomNavBar                                    │
│         └── PersonaPanel (drawer)                           │
│                                                             │
│  State: localStorage persistence + session state            │
├─────────────────────────────────────────────────────────────┤
│                      API ROUTES (Server)                    │
│                                                             │
│  /api/generate-card      → OpenAlex + PMC + Gemini          │
│  /api/generate-expanded  → Gemini (with visual specs)       │
│  /api/generate-recalibrated → Gemini (adjusted level)       │
│  /api/fetch-papers       → OpenAlex                         │
│  /api/log-event          → Supabase                         │
├─────────────────────────────────────────────────────────────┤
│                    EXTERNAL SERVICES                        │
│                                                             │
│  OpenAlex API        → Paper discovery by field/subfield    │
│  NIH eFetch          → Full-text XML (primary)              │
│  Europe PMC          → Full-text XML (fallback)             │
│  Gemini 2.5 Flash    → Card generation, expanded view       │
│  Gemini Flash Lite   → Subfield classification              │
│  Supabase            → Event logging (PostgreSQL)           │
│  Google Sheets       → Survey data collection               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Card Generation Pipeline

```
User completes onboarding
       │
       ▼
calculateScore() → determines Card A/B/C
       │
       ▼
POST /api/generate-card
       │
       ├─ 1. selectSubfield() → Gemini Flash Lite picks OpenAlex subfield
       │
       ├─ 2. fetchPaperFromOpenAlex() → gets paper metadata + abstract
       │
       ├─ 3. fetchFullText() → NIH eFetch → Europe PMC fallback
       │      (extracts Methods, Results, Discussion sections from XML)
       │
       ├─ 4. buildPromptParts() → constructs system instruction + user prompt
       │      (includes user profile, paper content, full text, schema)
       │
       ├─ 5. Gemini 2.5 Flash → generates all 3 card variants (A, B, C)
       │      + componentType + visualHints + comprehension_quiz
       │
       ├─ 6. validateCards() → checks structure, layers, body length
       │
       └─ 7. Returns JSON with all variants + paperTitle + paperAbstract + doi
```

---

## 5. Directory Structure

```
liquidread/
├── app/
│   ├── api/
│   │   ├── fetch-papers/
│   │   │   └── route.ts          # OpenAlex paper search endpoint
│   │   ├── generate-card/
│   │   │   └── route.ts          # Main card generation (OpenAlex → PMC → Gemini)
│   │   ├── generate-expanded/
│   │   │   └── route.ts          # Expanded reading view generation (Gemini w/ visuals)
│   │   ├── generate-recalibrated/
│   │   │   └── route.ts          # Recalibrated card generation (too basic/advanced)
│   │   └── log-event/
│   │       └── route.ts          # Supabase event logging endpoint
│   ├── globals.css               # Complete design system (737 lines)
│   ├── layout.tsx                # Root layout: fonts (DM Sans + Lora), metadata, viewport
│   ├── page.tsx                  # Entry point: renders <QuizApp />
│   └── favicon.ico
│
├── components/
│   ├── QuizApp.tsx               # Main state machine (522 lines). All routing logic.
│   ├── IntroScreen.tsx           # Welcome screen with Ari intro
│   ├── DemographicsScreen.tsx    # 4 demographic sub-screens (field, comfort, frequency, name)
│   ├── OnboardingInterstitial.tsx# Context-setting pause screens
│   ├── QuestionCard.tsx          # Generic question renderer
│   ├── OptionButton.tsx          # Single-choice pill button
│   ├── TextInput.tsx             # Styled text input for free-text questions
│   ├── SleepChartOption.tsx      # Inline SVG chart option for q5 visual choice
│   ├── ProgressBar.tsx           # Linear progress indicator
│   ├── FeedShell.tsx             # Feed layout container (tabs, TopBar, BottomNav)
│   ├── TopBar.tsx                # App header with logo and hamburger menu
│   ├── BottomNavBar.tsx          # Bottom navigation (Home, Bookmarks, Favorites)
│   ├── CardDisplay.tsx           # Card orchestrator (fetches AI card, manages state) — 790 lines
│   ├── FeedPaperCard.tsx         # Feed-style paper card with gradient header and skeleton loading
│   ├── ExpandedView.tsx          # Full-screen reading view with sections, visuals, quiz, feedback
│   ├── PersonaPanel.tsx          # Slide-out drawer showing user persona + depth controls
│   ├── FeedbackForm.tsx          # Calibration feedback (too basic / about right / too advanced)
│   ├── ReflectionScreen.tsx      # Suitability rating (1–5) + open feedback
│   ├── ThankYou.tsx              # Final thank-you screen
│   ├── cards/
│   │   ├── NarrativeCard.tsx     # Default card renderer (headline + body)
│   │   ├── StatsCard.tsx         # Stats-focused card with large stat callout
│   │   └── ComparisonCard.tsx    # Two-column comparison layout
│   └── visuals/
│       ├── StatCallout.tsx       # Large stat number display
│       ├── ProportionStrip.tsx   # Horizontal proportion bar
│       ├── DumbbellStrip.tsx     # Dumbbell chart (before/after comparison)
│       ├── ComparisonTable.tsx   # Side-by-side comparison table
│       ├── SlopeStrip.tsx        # Slope chart showing change between two points
│       ├── StepDiagram.tsx       # Step-by-step process visualisation
│       └── RankStrip.tsx         # Ranked items with relative bars
│
├── data/
│   ├── questions.ts              # 9 onboarding questions with options and point values
│   └── placeholderCards.ts       # 3 static placeholder cards for the feed view
│
├── lib/
│   ├── scoring.ts                # Score calculation and card variant assignment
│   └── submitData.ts             # Google Sheets webhook submission
│
├── types/
│   └── quiz.ts                   # TypeScript types: AppState, QuizState, SheetPayload, etc.
│
├── utils/
│   ├── fieldMap.ts               # Maps field groups to OpenAlex field IDs
│   ├── subfieldMap.ts            # 300+ OpenAlex subfields for Gemini-based narrowing
│   ├── logEvent.ts               # Client-side event logging utility (→ /api/log-event)
│   ├── sessionId.ts              # Session ID generation (UUID or ?participant= param)
│   └── reconstructAbstract.ts    # Converts OpenAlex inverted index to readable abstract text
│
├── public/
│   ├── logo-full.png             # Full LiquidRead wordmark (used in TopBar)
│   ├── logo-mark.png             # LiquidRead logomark (used in IntroScreen + ThankYou)
│   ├── file.svg, globe.svg, next.svg, vercel.svg, window.svg  # Default Next.js assets
│   └── favicon.ico
│
├── .env.local                    # Environment variables (not committed)
├── .gitignore
├── eslint.config.mjs             # ESLint 9 flat config with Next.js rules
├── next.config.ts                # Next.js configuration (currently empty)
├── package.json
├── postcss.config.mjs            # PostCSS with @tailwindcss/postcss plugin
├── tsconfig.json                 # TypeScript config (ES2017 target, bundler resolution)
└── README.md                     # This file
```

---

## 6. Environment Variables & External Services

Create a `.env.local` file in the project root with the following variables:

```env
# ── Google Gemini API ──────────────────────────────────────────────────────────
# Used server-side only (never NEXT_PUBLIC_). Powers card generation, expanded
# views, recalibration, and subfield selection.
# Get your key at: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ── Google Sheets Webhook ──────────────────────────────────────────────────────
# Apps Script web app URL that receives survey payloads as JSON POST requests.
# The script reads the body via e.postData.contents and appends a row to a sheet.
# Prefixed with NEXT_PUBLIC_ because the client calls it directly from submitData.ts.
NEXT_PUBLIC_SHEET_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec

# ── Supabase ───────────────────────────────────────────────────────────────────
# Used for structured event logging. The service role key is server-side only.
# Create a project at: https://supabase.com
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

### Service Setup Details

#### Google Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/apikey).
2. Create an API key.
3. The app uses two Gemini models:
   - **`gemini-2.5-flash`**: Main card generation, expanded view, recalibration. Called with `temperature: 0.7`, `maxOutputTokens: 8200`, `thinkingBudget: 0`.
   - **`gemini-2.5-flash-lite`**: Subfield selection only. Called with `temperature: 0.1`, `maxOutputTokens: 10`.

#### OpenAlex API

- **No API key required.** OpenAlex is a free, open scholarly data source.
- A `mailto` parameter (`edwinmeleth@gmail.com`) is included for polite API usage per their guidelines. Change this to your own email.
- Base URL: `https://api.openalex.org/works`
- Filters used: `has_abstract:true`, `has_doi:true`, `open_access.is_oa:true`, `type:article`, `from_publication_date:2021-01-01`.

#### Supabase

1. Create a Supabase project.
2. Create an `events` table with the following schema:

```sql
CREATE TABLE events (
  id            BIGSERIAL PRIMARY KEY,
  created_at    TIMESTAMPTZ DEFAULT now(),
  session_id    TEXT,
  event_type    TEXT,
  component_type TEXT,
  card_variant  TEXT,
  paper_title   TEXT,
  paper_field   TEXT,
  normalised_score NUMERIC,
  calibration_signal TEXT,
  suitability_rating NUMERIC,
  participant   TEXT,
  metadata      JSONB
);
```

3. Use the **service role key** (not the anon key) because log events are server-side.

#### Google Sheets (Apps Script)

1. Create a Google Sheet with columns matching the `SheetPayload` type (see [Types Reference](#types-reference) below).
2. Open Extensions → Apps Script.
3. Deploy a web app that accepts POST requests and parses `e.postData.contents` as JSON.
4. The client sends the POST with no `Content-Type` header (Apps Script reads raw body).

Example Apps Script:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp,
    data.fieldGroup,
    data.researchExperience,
    data.readingFrequency,
    data.priorInterviewName,
    data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7, data.q9,
    data.rawScore,
    data.normalisedScore,
    data.cardShown,
    data.calibrationResponse,
    data.field,
    data.suitability,
    data.openFeedback,
    data.paperTitle,
    data.generatedCardText,
  ]);
  return ContentService.createTextOutput("OK");
}
```

5. Deploy as a web app accessible to "Anyone".

---

## 7. Setup & Installation

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (ships with Node.js)
- A **Gemini API key** (see above)
- A **Supabase project** with the `events` table (see above)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Edwin-IITJ/LiquidRead.git
cd LiquidRead/Apps/liquidread

# 2. Install dependencies
npm install

# 3. Create environment file
# Copy the template above and fill in your keys:
cp .env.example .env.local   # Or create .env.local manually

# 4. Start the development server
npm run dev

# 5. Open the app
# Navigate to http://localhost:3000
```

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Next.js dev server with hot reload |
| `npm run build` | Create production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint with Next.js rules |

---

## 8. Component Reference

### State Machine: `QuizApp.tsx`

This is the brain of the application. It manages all state transitions through a `QuizState` object (defined in `types/quiz.ts`) and an `onboardingStep` counter (0–16).

**Key state fields:**

| Field | Type | Purpose |
|-------|------|---------|
| `appState` | `'onboarding' \| 'scoring' \| 'card' \| 'thankyou'` | High-level application phase |
| `onboardingStep` | `number` (0–16) | Current step within onboarding |
| `answers` | `Record<string, Answer>` | All quiz answers keyed by question ID |
| `field` | `string` | Free-text research interest (q8) |
| `fieldGroup` | `string` | Selected academic field (q1 demographics) |
| `researchExperience` | `string` | Comfort level with papers |
| `readingFrequency` | `string` | How often they read research |
| `priorInterviewName` | `string` | Optional returning participant name |
| `rawScore` | `number` | Sum of answer points |
| `normalisedScore` | `number` | Score normalised to 0–10 |
| `cardShown` | `'A' \| 'B' \| 'C'` | Which card variant was assigned |
| `calibrationResponse` | `CalibrationResponse \| null` | User's calibration feedback |
| `suitability` | `number` | 1–5 rating |

**State persistence:** The state is stored in `localStorage` under key `mtp-survey-progress`. When the user returns, state is restored. Stale states (`intro`, `demographics`, `questions`) from old versions are detected and reset. Completion is tracked via `mtp-survey-done`.

**Session identification:** `getSessionId()` checks for a `?participant=` URL parameter first (useful for specific study participants), then falls back to a `crypto.randomUUID()` stored in localStorage.

### Onboarding Components

#### `IntroScreen`

Welcome screen. Shows the LiquidRead logomark, headline ("Research, shaped to how you read."), subheadline, Ari introduction, and a "Start onboarding" CTA.

#### `DemographicsScreen`

Four sub-screens controlled by the `step` prop: `field`, `comfort`, `frequency`, `priorName`. Each uses a shared `ScreenShell` layout component that provides:
- Back button
- Progress bar
- Step label ("About you")
- Question text
- Helper line
- Options slot (children)
- Ari response line
- Continue button (disabled until valid)

Contains its own option lists, Ari response maps, and an `OptionPill` atom component.

#### `OnboardingInterstitial`

Context-setting pause screen used at steps 5 and 10. Takes `headline`, `body`, and `ariLine` as props. Always shows the Continue button enabled.

#### `QuestionCard`

Generic question renderer. Handles both `single` (option selection) and `text` (free-text input) question types. Supports a `visual-cards` layout for q5 (renders `SleepChartOption` instead of a text pill for the chart option).

#### `SleepChartOption`

An inline SVG component that renders a small line chart (Hours of sleep vs Error rate) as a selectable option. Used in q5 to test whether the user is drawn to visual/data presentation.

### Feed & Reading Components

#### `FeedShell`

The main feed layout container. Manages:
- `TopBar` (header)
- Tab bar ("For You", "Impact", "Relevant")
- `CardDisplay` (paper cards)
- `BottomNavBar`
- `PersonaPanel` (slide-out drawer)

#### `CardDisplay` (790 lines)

The largest component. Orchestrates the entire paper card experience:
1. **Fallback content**: Contains hardcoded paper content for 6 fields (default, Medicine, Design, Engineering, Business, Social Sciences) × 3 card variants (A, B, C). Each variant has multiple layers with specific labels.
2. **AI generation**: On mount, calls `POST /api/generate-card` to fetch a personalised card. Falls back to hardcoded content on failure.
3. **State management**: Tracks loading, error, fallback status, expanded view state, component type, visual hints, comprehension quiz.
4. **Rendering**: Shows a `FeedPaperCard` (functional) + 3 placeholder cards. Tapping the functional card opens `ExpandedView`.

**Paper content routing** (`PAPER_CONTENT` map):

| Field Group | Paper |
|-------------|-------|
| default / Sciences | Stanford aging study (Shen et al., Nature Aging 2024) |
| Medicine | Lecanemab Alzheimer's trial (Van Dyck et al., NEJM 2023) |
| Design | Screen time self-report accuracy (Parry et al., Nature Human Behaviour 2021) |
| Engineering | Autonomous vs human driving safety (Abdel-Aty & Ding, Nature Communications 2024) |
| Business | Hybrid work RCT (Bloom et al., Nature 2024) |
| Social Sciences | Many-analyst study (Breznau et al., PNAS 2022) |

#### `FeedPaperCard`

A card component styled like a research feed item. Features:
- Gradient header area with SVG constellation/neural-network pattern overlay
- Source badge (coloured by field)
- Title, description, date, read time
- Loading skeleton state
- Placeholder (non-interactive) vs active (tappable) modes

#### `ExpandedView` (660 lines)

Full-screen reading experience with:
- Paper sections generated by Gemini (via `/api/generate-expanded`)
- Inline data visualisations (7 visual component types)
- Comprehension quiz with answer checking
- Calibration feedback form
- Suitability rating
- Adjacent card previews (shows how the paper would look at ±1 complexity level)
- Recalibration flow (calls `/api/generate-recalibrated` if user says content was too basic/advanced)

#### `PersonaPanel`

A drawer that slides in from the left, showing:
- The user's generated persona description
- An editable persona text area
- Additional context text area
- Depth level control (Simple / Balanced / Technical)

#### Card Type Components (`cards/`)

| Component | Used When | Behaviour |
|-----------|-----------|-----------|
| `NarrativeCard` | `componentType === "NarrativeCard"` | Default renderer. Shows headline + body per layer. Uses serif font (`font-serif` = Lora). |
| `StatsCard` | `componentType === "StatsCard"` | Same as NarrativeCard but adds a large stat callout block (5xl font size) on layer 1 when `visualHints.keyStat` is present. |
| `ComparisonCard` | `componentType === "ComparisonCard"` | On layer 1, splits body text into two columns with labelled headers from `visualHints.comparisonLeft/Right`. Other layers render normally. |

#### Visual Components (`visuals/`)

These are data visualisation components used inside `ExpandedView`. Gemini specifies which visual to use, its data shape, and positioning.

| Component | Visual Type | Data Shape |
|-----------|-------------|------------|
| `StatCallout` | `"StatCallout"` | `{ value: string, label: string }` |
| `ProportionStrip` | `"ProportionStrip"` | `{ segments: Array<{ label: string, value: number, color: string }> }` |
| `DumbbellStrip` | `"DumbbellStrip"` | `{ items: Array<{ label: string, left: number, right: number }>, leftLabel: string, rightLabel: string }` |
| `ComparisonTable` | `"ComparisonTable"` | `{ headers: string[], rows: Array<{ label: string, values: string[] }> }` |
| `SlopeStrip` | `"SlopeStrip"` | `{ items: Array<{ label: string, startValue: number, endValue: number }>, startLabel: string, endLabel: string }` |
| `StepDiagram` | `"StepDiagram"` | `{ steps: Array<{ title: string, description: string }> }` |
| `RankStrip` | `"RankStrip"` | `{ items: Array<{ label: string, value: number }>, unit: string }` |

---

## 9. API Route Reference

### `POST /api/generate-card`

**Purpose:** Main card generation pipeline. Fetches a paper, optionally retrieves full text, and generates all three card variants in a single Gemini call.

**Request Body:**
```json
{
  "cardType": "A",
  "fieldGroup": "Engineering",
  "userProfile": {
    "field": "Engineering",
    "readingComfort": "I manage, but it takes effort",
    "readingGoal": "Going deep on something specific I'm building or writing",
    "timeAvailable": "10–15 minutes",
    "trustAnchor": "What they found",
    "researchInterest": "battery technology",
    "confusionResponse": "Re-read the paragraph more slowly until it clicks",
    "userPersona": "You appear to be an Engineering professional who reads research for going deep...",
    "userContext": ""
  }
}
```

**Response (200):**
```json
{
  "A": { "maxLayer": 2, "layers": [...] },
  "B": { "maxLayer": 3, "layers": [...] },
  "C": { "maxLayer": 2, "layers": [...] },
  "componentType": "StatsCard",
  "confidence": 0.91,
  "visualHints": {
    "keyStat": "27%",
    "keyStatLabel": "less cognitive decline",
    "comparisonLeft": null,
    "comparisonRight": null
  },
  "comprehension_quiz": [...],
  "paperTitle": "Lecanemab in Early Alzheimer's Disease",
  "paperAbstract": "...",
  "doi": "https://doi.org/10.1056/NEJMoa2212948"
}
```

**Pipeline steps:**
1. Select subfield via Gemini Flash Lite (if research interest provided).
2. Fetch paper from OpenAlex (with subfield filter if available, otherwise field-level).
3. Attempt full-text fetch from NIH eFetch → Europe PMC fallback (if PMC ID available).
4. Build prompt with user profile, paper content, full text sections, and output schema.
5. Call Gemini 2.5 Flash (with retry: 3 attempts, 2s/4s backoff on 503/429).
6. Parse and validate response (uses `jsonrepair` for malformed JSON).
7. Return combined response.

**Error handling:** Returns hardcoded fallback content on any failure. Client detects this via `isFallback` flag.

### `POST /api/generate-expanded`

**Purpose:** Generates the full expanded reading view content with visual specifications.

**Uses Gemini 2.5 Flash** with thinking enabled. Produces:
- Hook line
- Ordered sections with text content
- Visual specifications (type, data, position) for each section
- Each visual is validated against the 7 supported types

### `POST /api/generate-recalibrated`

**Purpose:** Generates a recalibrated version of the expanded view when the user indicates the content was "too basic" or "too advanced".

**Additional parameter:** `calibrationSignal: "too_basic" | "too_advanced"` — determines whether to increase or decrease complexity.

### `GET /api/fetch-papers`

**Purpose:** Direct OpenAlex search endpoint (used for auxiliary paper discovery).

**Query params:** `?fieldGroup=Engineering`

**Returns:** Array of `{ title, abstract, year, citationCount, doi, journal, openAccessUrl }`.

### `POST /api/log-event`

**Purpose:** Logs structured events to Supabase.

**Request Body:** Any object matching the `events` table schema.

**Behaviour:** Silent failure — logging must never break the UI. The client-side `logEvent()` utility wraps this call in a try-catch that swallows errors.

---

## 10. Data Layer & Utilities

### `types/quiz.ts` — Types Reference

```typescript
// Application state phases
type AppState = 'intro' | 'demographics' | 'questions' | 'onboarding' | 'scoring' | 'card' | 'reflection' | 'feedback' | 'thankyou';

// Card complexity levels
type CardType = 'A' | 'B' | 'C';

// Calibration feedback options
type CalibrationResponse = 'too_basic' | 'just_right' | 'too_advanced';

// Quiz state (full application state object)
interface QuizState {
  appState: AppState;
  onboardingStep: number;         // 0 = welcome, 1–15 = counted steps, 16 = final
  progressIndex: number;          // Legacy, kept for compatibility
  answers: Record<string, Answer>;
  field: string;                  // Free-text research interest
  fieldGroup: string;             // Selected academic field
  researchExperience: string;     // Comfort level label
  readingFrequency: string;       // Frequency label
  rawScore: number;
  normalisedScore: number;
  cardShown: CardType;
  calibrationResponse: CalibrationResponse | null;
  suitability: number;
  openFeedback: string;
  priorInterviewName: string;
  paperTitle: string;
  generatedCardText: string;
}

// Google Sheets payload
interface SheetPayload {
  timestamp: string;
  fieldGroup: string;
  researchExperience: string;
  readingFrequency: string;
  q1–q7, q9: string;             // Answer labels
  rawScore: number;
  normalisedScore: number;
  cardShown: CardType;
  calibrationResponse: string;
  field: string;
  suitability: number;
  openFeedback: string;
  priorInterviewName: string;
  paperTitle: string;
  generatedCardText: string;
}
```

### `data/questions.ts`

Contains 9 questions (q1–q9, note: q8 is last in array order). Each question has:
- `id`: `'q1'` through `'q9'`
- `text`: Question string
- `type`: `'single'` or `'text'`
- `layout?`: `'visual-cards'` for q5
- `options?`: Array of `{ id, label, points }`

**Point values by question:**

| Q | Options (id: points) | Max |
|---|---------------------|-----|
| q1 | A:2, B:2, C:1, D:0 | 2 |
| q2 | A:2, B:0 | 2 |
| q3 | A:2, B:1, C:1, D:0 | 2 |
| q4 | A:1, B:2, C:1, D:1 | 2 |
| q5 | A:0, B:3, C:2 | 3 |
| q6 | A:0, B:2, C:3 | 3 |
| q7 | A:2, B:0, C:1 | 2 |
| q9 | A:0, B:0, C:0, D:0 | 0 |
| q8 | (text, no points) | 0 |

**Maximum possible raw score: 16** (2+2+2+2+3+3+2+0+0).

### `utils/fieldMap.ts`

Maps survey field groups to OpenAlex field IDs:

| Field Group | OpenAlex ID | Notes |
|-------------|------------|-------|
| Design | 17 | Computer Science (contains HCI/design research) |
| Engineering | 22 | |
| Sciences | 17 | Uses Computer Science as representative |
| Social Sciences | 33 | |
| Humanities | 12 | |
| Medicine | 27 | |
| Business | 14 | |
| Other | null | Falls back to free-text search |

### `utils/subfieldMap.ts`

Contains ~300 OpenAlex subfield entries as `{ id: string, name: string }[]`. This list is sent to Gemini Flash Lite, which selects the most relevant subfield based on the user's free-text research interest.

### `utils/reconstructAbstract.ts`

OpenAlex stores abstracts as inverted indexes (`{ word: [position1, position2, ...] }`). This utility reconstructs the readable abstract text by:
1. Finding the maximum position
2. Creating a word array
3. Populating positions from the inverted index
4. Joining with spaces

### `utils/sessionId.ts`

Generates or retrieves a session identifier:
1. Checks for `?participant=` URL parameter → stores in sessionStorage, returns it
2. Falls back to `localStorage["liquidread-session-id"]` → creates a `crypto.randomUUID()` if not present

### `utils/logEvent.ts`

Client-side event logging utility. Sends structured events to `POST /api/log-event`. All fields are explicitly listed (no dynamic spreading) to ensure schema consistency. Silently catches all errors.

**Event types logged:**

| Event | When |
|-------|------|
| `session_start` | User completes onboarding and scoring begins |
| `card_generated` | AI card generation succeeds |
| `card_rendered` | Card is displayed to the user |
| `card_rated` | User submits calibration + suitability feedback |

### `lib/scoring.ts`

See [Scoring Algorithm](#11-scoring-algorithm) below.

### `lib/submitData.ts`

Sends the final survey payload to Google Sheets via the Apps Script webhook. Uses `fetch()` with `POST` method and no `Content-Type` header (Apps Script reads raw body via `e.postData.contents`).

---

## 11. Scoring Algorithm

The scoring system determines which card variant (A, B, or C) the user sees.

### Calculation

```
rawScore = sum of all answer.points (excluding q8 text question)
normalisedScore = (rawScore / 16) × 10    // rounded to 2 decimal places
```

### Card Assignment

| Normalised Score | Card Variant | Description |
|-----------------|-------------|-------------|
| 0.00 – 3.75 | **A** (Accessible) | Plain language, analogies, storytelling |
| 3.76 – 6.50 | **B** (Balanced) | Technical with context, statistics explained |
| 6.51 – 10.00 | **C** (Technical) | Full academic depth, p-values, methodology |

### Score Interpretation

- **Low scores** → Users who prefer simpler explanations, have less research experience, less time, and are drawn to plain-language framing.
- **High scores** → Users who are comfortable with complexity, read research frequently, have more time, and prefer technical precision.

Note: q9 (trust anchor) and q8 (research interest) contribute 0 points — they are used solely for personalisation, not scoring.

---

## 12. Design System & Visual Language

### Typography

| Role | Font | Variable | Weights Used |
|------|------|----------|-------------|
| UI (default) | DM Sans | `--font-sans` | 300, 400, 500, 600, 700 |
| Editorial/Card content | Lora | `--font-serif` | 400, 600, 700 (normal + italic) |

Applied in `layout.tsx` via `next/font/google` with `display: "swap"`.

### Colour Palette

#### Onboarding Theme (warm, paper-like)

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F2EDE4` | Page background |
| Card background | `#FDFAF5` | Quiz card container |
| Border | `#DDD5C8` | Card borders, dividers |
| Primary text | `#2C2218` | Headlines, primary copy |
| Secondary text | `#6B5C4A` | Body text, descriptions |
| Muted text | `#9C8B78` | Helper lines, step labels |
| CTA (primary) | `#7C5C3E` | Buttons (warm brown) |
| CTA hover | `#6A4E34` | Button hover state |
| CTA active | `#5A4028` | Button active/pressed state |
| Disabled | `#EDE5D8` | Disabled button background |
| Accent bg | `#EDE5D8` | Ari avatar badge background |
| Border light | `#E8E0D5` | Section dividers |
| Selected option | `#F5EEE4` | Selected option background |

#### Feed Theme (clean, modern)

| CSS Variable | Hex | Usage |
|-------------|-----|-------|
| `--feed-bg` | `#f8f9fa` | Feed background |
| `--feed-card-bg` | `#ffffff` | Card backgrounds |
| `--feed-border` | `#e8eaed` | Card borders |
| `--feed-text-primary` | `#1a1a2e` | Primary text |
| `--feed-text-secondary` | `#5f6368` | Secondary text |
| `--feed-text-muted` | `#9aa0a6` | Muted text |
| `--feed-accent` | `#3b5998` | Accent colour |
| `--feed-tab-active` | `#1a73e8` | Active tab indicator |

#### Source Badge Colours

| Field | Colour |
|-------|--------|
| Medicine | `#c41c1c` |
| Engineering | `#1565c0` |
| Design | `#7b1fa2` |
| Business | `#00695c` |
| Sciences | `#e65100` |
| Social Sciences | `#4527a0` |
| Default | `#37474f` |

### Animations

Defined in `globals.css`:

| Class | Animation | Duration |
|-------|-----------|----------|
| `.fade-in` | Fade in + translate up 6px | 0.25s ease-out |
| `.scale-fade-in` | Fade in + scale from 0.97 | 0.4s ease-out |

### Responsive Design

- Mobile-first. Most layouts use `w-full` with `max-w-2xl` container.
- Onboarding: single column on all screens.
- Feed: card-based layout, stacked vertically.
- Expanded view: full-screen overlay.
- Question options: `sm:grid-cols-3` for visual-cards layout (q5).
- Buttons: `w-full sm:w-auto` for mobile/desktop breakpoints.

### Ari (AI Guide) Visual Pattern

The "Ari" character appears throughout onboarding as a consistent visual pattern:
- **Badge**: `w-4 h-4` (or `w-5 h-5` on intro) rounded-full circle with `bg-[#EDE5D8]`
- **Letter**: Bold "A" in `text-[#7C5C3E]`, `text-[9px]` (or `text-[10px]` on intro)
- **Text**: Italic, `text-sm`, `text-[#6B5C4A]`
- **Layout**: `flex items-start gap-2` or `gap-2.5`

---

## 13. AI Prompt Engineering

### Card Generation Prompt Structure

The Gemini prompt for card generation is built in `buildPromptParts()` and consists of:

#### System Instruction
Contains:
1. **Philosophy**: "Research belongs to everyone, not just specialists. Meet the reader where they are."
2. **Rules**: 15 explicit constraints including:
   - Never drop statistics — always explain what they mean
   - Add inline credibility notes after first statistics block
   - Banned words: delve, realm, crucial, importantly, groundbreaking, game-changer, navigate, landscape, robust
   - No em dashes
   - Write like a sharp science journalist, not an AI assistant
   - Use contractions naturally
   - Vary sentence length

#### Dynamic Prompt
Contains:
1. **User profile** (all 8 personalisation signals)
2. **Personalisation rules** (compressed):
   - Time → word count mapping: ≤5min=≤120 words, 10-15min=150-200 words, 30min=250-300 words
   - Jargon calibration by access level
   - Trust anchor → opening structure
   - Confusion response → term explanation depth
3. **Paper content** (title, journal, year, authors, abstract + full text sections if available)
4. **Full text usage rules** (Card A ignores full text; Card B uses results; Card C uses all sections)
5. **Task and schema** (exact JSON output format for all 3 cards)
6. **Component classification** instructions (NarrativeCard, StatsCard, ComparisonCard)
7. **Visual hints** specification
8. **Comprehension quiz** specification (2 questions, 4 options each)

### Expanded View Prompt

Generates section-by-section content with embedded visual specifications. Each section can optionally include a visual component (one of 7 types) with specific data and positioning (above or below text).

### Recalibration Prompt

Takes the same paper but adjusts complexity based on the calibration signal:
- `"too_basic"` → increase technical depth, add methodology details
- `"too_advanced"` → simplify language, add more context, reduce jargon

---

## 14. Event Logging & Analytics

### Events Table Schema

All events are stored in Supabase with this structure:

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | TEXT | UUID or participant name |
| `event_type` | TEXT | Event identifier |
| `component_type` | TEXT | NarrativeCard / StatsCard / ComparisonCard |
| `card_variant` | TEXT | A / B / C |
| `paper_title` | TEXT | Title of the paper shown |
| `paper_field` | TEXT | User's field group |
| `normalised_score` | NUMERIC | User's normalised score (0–10) |
| `calibration_signal` | TEXT | too_basic / just_right / too_advanced |
| `suitability_rating` | NUMERIC | 1–5 suitability score |
| `participant` | TEXT | Named participant (if provided) |
| `metadata` | JSONB | Additional context (answers, user profile, etc.) |

### Event Types

| Event | Trigger | Metadata |
|-------|---------|----------|
| `session_start` | User clicks "Prepare my first read" | All quiz answers, field group, experience level |
| `card_generated` | AI card generation completes | Confidence, visual hints, user profile signals |
| `card_rendered` | Card is displayed in the feed | Component type, variant, paper title |
| `card_rated` | User submits feedback | Suitability rating, calibration signal, open feedback |

---

## 15. Deployment

### Vercel (Current Setup)

The app is deployed on Vercel. The `.vercel/project.json` contains the project configuration.

**To deploy:**

1. Install Vercel CLI: `npm i -g vercel`
2. Link the project: `vercel link`
3. Set environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SHEET_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy: `vercel --prod`

**Or connect the GitHub repository** to Vercel for automatic deployments on push.

### Important Notes

- The `optionalDependencies` in `package.json` include `@next/swc-linux-x64-gnu` and `@next/swc-linux-x64-musl` for Vercel's Linux build environment. These are not needed locally on Windows/macOS.
- API routes run as serverless functions on Vercel. The Gemini API calls may occasionally hit cold start latency.
- The `generate-card` route includes retry logic (3 attempts, 2s/4s backoff) for Gemini 503/429 responses.

---

## 16. Role-Specific Replication Guides

### For Developers

#### Replicating the Frontend

1. **Bootstrap**: `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
2. **Fonts**: Add DM Sans + Lora via `next/font/google` in `layout.tsx`. Set as CSS variables `--font-sans` and `--font-serif`.
3. **State machine**: Build `QuizApp.tsx` as a single client component (`"use client"`) with `useState` for `QuizState` and `useEffect` for localStorage persistence.
4. **Step routing**: Use `onboardingStep` (0–16) to render different components. Steps map to demographic screens (1–4), interstitials (5, 10), questions (6–9, 11–15), and a transition screen (16).
5. **Component hierarchy**: `page.tsx` → `QuizApp` → conditional rendering based on `appState` and `onboardingStep`.

#### Replicating the Backend

1. **API routes**: Create Next.js App Router API routes under `app/api/`.
2. **OpenAlex integration**: Use `https://api.openalex.org/works` with filter parameters. Include a `mailto` parameter. Handle inverted index abstracts via `reconstructAbstract()`.
3. **Full text retrieval**: Try NIH eFetch first (`eutils.ncbi.nlm.nih.gov`), then Europe PMC (`ebi.ac.uk/europepmc/webservices/rest`). Extract Methods/Results/Discussion via regex on the XML.
4. **Gemini integration**: Use the `generateContent` endpoint directly (`generativelanguage.googleapis.com/v1beta/models/`). Pass system instructions separately. Use `jsonrepair` on the response.
5. **Error handling**: Always provide fallback content. Never let API failures break the user experience.

#### Key Implementation Details

- **No routing library**: All navigation is state-driven within `QuizApp`. There is only one page (`/`).
- **No global state library**: Plain `useState` + localStorage. No Redux, Zustand, or Context API.
- **TypeScript strict mode**: Enabled in `tsconfig.json`.
- **ESLint**: Flat config with `eslint-config-next/core-web-vitals` and TypeScript rules.
- **PostCSS**: Uses `@tailwindcss/postcss` (Tailwind v4 style).

### For Designers

#### Design Philosophy

1. **Warm paper aesthetic** for onboarding: Cream/ivory backgrounds (`#F2EDE4`, `#FDFAF5`), warm brown CTAs (`#7C5C3E`), serif font for editorial content (Lora), sans-serif for UI (DM Sans).
2. **Clean modern feed** for the reading experience: Light grey background (`#f8f9fa`), white cards, Google-inspired colour tokens.
3. **Conversational tone**: Ari (AI guide) adds personality through contextual responses after each selection. The tone is informed, not clinical.
4. **No decorative elements**: No icons in buttons, no gradients on onboarding, minimal shadows. Content speaks for itself.
5. **Progressive disclosure**: Cards use layered content (Preview → Story/Findings → Methods → Sources). Users control depth.

#### Replicating the Visual Design

1. **Onboarding cards**: `max-w-2xl`, `rounded-2xl`, `border border-[#DDD5C8]`, `p-6 sm:p-10`, `shadow-none`.
2. **Option pills**: Full-width, `rounded-xl`, `px-5 py-4`, border changes on selection from `#DDD5C8` to `#7C5C3E`.
3. **Progress bar**: 1px height, `bg-[#E8E0D5]` track, `bg-[#7C5C3E]` fill, `rounded-full`.
4. **Feed cards**: `rounded-xl` with gradient header area and SVG constellation pattern overlay.
5. **Typography scale**: Headlines `text-3xl`/`text-2xl`/`text-xl`, body `text-base`/`text-sm`, labels `text-xs uppercase tracking-widest`.

#### Brand Assets

| Asset | Location | Dimensions |
|-------|----------|-----------|
| Full wordmark | `public/logo-full.png` | 112×24 displayed |
| Logomark | `public/logo-mark.png` | 64×64 displayed |
| Favicon | `app/favicon.ico` | Standard |

### For Researchers

#### Study Design

This application is built as a research instrument for studying how personalised research summaries affect reading comprehension and engagement.

#### Data Collection Points

1. **Onboarding answers**: 7 scored questions + 2 unscored questions + 4 demographic inputs.
2. **Calibration signal**: too_basic / just_right / too_advanced.
3. **Suitability rating**: 1–5 Likert scale ("felt completely generic" to "felt made specifically for me").
4. **Open feedback**: Free text on what would improve the experience.
5. **Event stream**: Session start, card generated, card rendered, card rated — all with timestamps and metadata.

#### Participant Tracking

- Use `?participant=ParticipantName` URL parameter for named participants.
- Session IDs are UUIDs stored in localStorage.
- Returning participants can enter their name at step 4 to link sessions.

#### Data Access

- **Google Sheets**: Raw survey payloads with all answers, scores, and feedback.
- **Supabase**: Structured event log with session traces and interaction metadata.

#### Modifying the Study

- **Add questions**: Add entries to `data/questions.ts`. Update `STEP_TO_Q_INDEX` and `QUESTION_STEP_META` in `QuizApp.tsx`. Adjust `TOTAL_STEPS`.
- **Change scoring**: Modify point values in `questions.ts`. Adjust `MAX_RAW_SCORE` and thresholds in `lib/scoring.ts`.
- **Change card variants**: Modify the fallback content in `CardDisplay.tsx` and the prompt in `generate-card/route.ts`.

### For Project Managers

#### Effort Estimates

| Component | Approximate Lines | Complexity | Dependencies |
|-----------|------------------|------------|--------------|
| Onboarding flow | ~1,500 | Medium | None |
| Card generation API | ~650 | High | Gemini, OpenAlex, PMC |
| Expanded view | ~660 | High | Gemini, visual components |
| Visual components (7) | ~500 total | Medium | None |
| Feed UI | ~600 | Medium | API routes |
| Event logging | ~100 | Low | Supabase |
| Scoring & submission | ~100 | Low | Google Sheets |
| CSS design system | ~740 | Medium | None |
| Total | ~4,850+ | — | — |

#### External Dependencies & Risks

| Service | Risk | Mitigation |
|---------|------|------------|
| Gemini API | Rate limiting, model changes, outages | Retry logic + hardcoded fallback content |
| OpenAlex | API changes, no matching papers | Fallback paper hardcoded in route |
| NIH eFetch / Europe PMC | Timeouts, unavailability | 6-second timeouts, dual-source fallback |
| Supabase | Outage | Silent failure (never blocks UI) |
| Google Sheets | Script quota limits | Silent failure |

#### Key Decisions to Make When Replicating

1. **Fallback paper content**: Current hardcoded papers are field-specific. New deployments need equivalent fallback content for each supported field.
2. **Gemini model**: Currently uses `gemini-2.5-flash`. Model updates or alternatives (e.g., `gemini-2.5-pro`) would change cost and quality characteristics.
3. **Paper selection logic**: Currently picks a random paper from the top 10 OpenAlex results by citation count. This could be tuned.
4. **Calibration thresholds**: The score → card mapping (≤3.75 → A, ≤6.5 → B, >6.5 → C) was set through design judgement. It may need empirical tuning based on study data.

---

## 17. Known Limitations & Future Work

### Current Limitations

1. ~~**Single-page study mode**~~: *(Fixed)* Users can now explore multiple papers after feedback. A "Explore another paper" CTA appears on the thank-you screen, and users can optionally change their research topic. Paper deduplication prevents repeats.
2. **No authentication**: No user accounts. Session tracking is via localStorage UUIDs.
3. **Feed is static**: Only the "For You" tab is active. "Impact" and "Relevant" tabs are placeholders.
4. **Navigation is decorative**: BottomNavBar buttons (Bookmarks, Favorites) have no functionality.
5. **Field-specific fallback papers**: Only 6 fields have hardcoded fallback content. Humanities lacks a dedicated fallback paper (uses the default aging study).
6. **Full text retrieval**: Depends on papers having PMC IDs. Many papers do not.
7. ~~**OpenAlex coverage**~~: *(Fixed)* The `Sciences` field group previously mapped to Computer Science (field ID 17). It now maps broadly across Physics, Chemistry, Biology, Environmental Science, Mathematics, Earth Sciences, and Materials Science.
8. **Single language**: English only.

### Potential Extensions

- ~~Multi-paper feed with real-time paper discovery~~ *(Implemented — users can explore multiple papers per session)*
- User accounts with reading history and preference learning
- Bookmarking and saving papers
- Social features (sharing, discussions)
- PDF upload for arbitrary papers
- Cross-device sync
- Accessibility improvements (screen reader testing, keyboard navigation)
- Internationalisation

---

## License

This project is part of an academic research initiative at IIT Jodhpur.
