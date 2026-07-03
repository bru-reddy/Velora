# 🍽️ Velora — AI Powered Personalized Menu Recommendation System

Velora is a fully client-side web application that recommends dishes tailored
to a user's mood, diet, budget, and cravings using **Grok (xAI)**, accessed
for free through **Puter.js** — no API key required. It was built as a 2nd
semester Computer Science mini project using only **HTML5, CSS3, and vanilla
JavaScript (ES6)** — no frameworks, no backend, no database.

---

## 📖 Project Overview

Traditional restaurant menus are static — every customer sees the same list
of dishes regardless of their taste, mood, or dietary needs. Velora solves
this by combining a locally curated dataset of 76 dishes with the
reasoning power of **Grok**, xAI's AI model. Users fill out a short
preference form (diet type, cuisine, budget, spice level, meal type,
calories, allergies, and mood), and the AI responds with six personalized
dish recommendations — each with a short description, an estimated price
and calorie count, a human-style explanation of *why* it was picked, and a
health score.

Everything runs in the browser. Favorites are persisted using the browser's
**Local Storage**, so no server or database is required. The AI itself
requires **zero configuration** — there's no API key to create, paste, or
manage, thanks to Puter.js (see below).

---

## ✨ Features

- 🔍 **Search bar** — instantly search all 76 dishes by name, cuisine, or description
- 🍜 **Food categories** — filter the catalog by cuisine using chip buttons
- 📝 **Preference form** — collects diet type, cuisine, budget, spice level, meal type, calories, allergies, and mood
- 🤖 **AI-powered recommendations** — Grok (xAI) generates 6 personalized dishes with reasons and health scores
- 🆓 **Zero-config AI** — no signup, no API key, no billing setup; powered by Puter.js's free "User-Pays" model
- 💛 **Favorites system** — save/unsave any dish with one click, persisted in Local Storage
- ⏳ **Loading animation** — animated plate/spinner while waiting on the AI
- ⚠️ **Error handling** — friendly error state with a "Try Again" button if the AI call fails
- 🈳 **Empty states** — helpful messaging when no dishes match a search or no recommendations exist yet
- 📱 **Fully responsive** — mobile-first layout with a collapsible navigation menu
- 🎨 **Modern glassmorphism UI** — soft shadows, rounded cards, an animated aurora-gradient hero, and smooth hover/scroll animations

---

## 🛠️ Technologies Used

| Technology              | Purpose                                      |
|--------------------------|-----------------------------------------------|
| HTML5                    | Page structure & semantic markup             |
| CSS3                     | Styling, glassmorphism, animations, responsive layout |
| JavaScript (ES6)         | App logic, DOM rendering, state management    |
| Puter.js + Grok (xAI)     | Free, keyless AI-generated personalized recommendations |
| Local Storage (Web API)  | Persisting favorites                          |
| Google Fonts             | Fraunces (display), Plus Jakarta Sans (body), JetBrains Mono (data) |

No React, Next.js, Tailwind, Bootstrap, jQuery, Node.js/Express, or any
database is used anywhere in this project. No API key management or backend
proxy is needed for the AI either — Puter.js calls the model directly from
the browser.

---

## 📁 Folder Structure

```
Velora/
│── index.html          # Main HTML page — all sections (nav, hero, form, etc.)
│── style.css            # All styling: glassmorphism, layout, responsiveness
│── script.js             # App logic: rendering, filters, favorites, form handling
│── ai.js                  # Reusable AI integration module (Puter.js + Grok)
│── data.js                 # Local dataset of 76 dishes + cuisine list
│── README.md                # This file
│── assets/
│     ├── images/              # (optional) food photography / backgrounds
│     └── icons/                # (optional) custom icon assets
```

**Script load order matters:** `data.js` → `ai.js` → `script.js`, since
`ai.js` reads from `DISH_DATA` and `script.js` calls functions from both.

---

## 🚀 Setup Instructions

Velora has zero build steps — it's plain static HTML/CSS/JS.

1. **Download or clone** this project folder.
2. Open the `Velora` folder.
3. Double-click `index.html` to open it directly in your browser, **or**
   serve it locally for the best experience:

   ```bash
   # Using Python (any OS with Python installed)
   cd Velora
   python -m http.server 5500
   ```

   Then visit `http://localhost:5500` in your browser.

4. Scroll to **Get Recommendations**, fill out your preferences, and click
   **✨ Get AI Recommendations**. That's it — no key, no signup, no config.

> 💡 A local web server (step 3) is recommended over opening the file
> directly, since some browsers restrict network calls from `file://`
> pages. The first time you request recommendations, Puter.js may show a
> quick, free, one-time sign-in popup so AI usage is tied to your visit
> instead of to Velora's source code — click the **🤖 Powered by AI**
> button in the navbar for details.

---

## 🤖 AI Setup (Zero Configuration)

Velora generates recommendations using **Grok** (xAI), accessed through
**[Puter.js](https://puter.com)** — no API key required.

Why this matters for a static, no-backend project: calling an AI provider's
REST API straight from the browser normally means either embedding a secret
key in public source code (anyone can steal it from DevTools) or making
every visitor create a developer account. Puter.js sidesteps both with a
"User-Pays" model — it's a single `<script>` tag that proxies AI calls, and
each visitor's own free Puter account (not Velora's code) covers their
usage. There is nothing to sign up for as the developer, nothing to embed,
and nothing to leak.

**Nothing to configure** — just open the app and click **✨ Get AI
Recommendations**. The first time, your browser may show a quick, free,
one-time Puter sign-in popup (a few seconds); after that, it won't ask
again.

**Want to switch models?** Puter.js gives every model — Grok, Gemini, GPT,
Claude, and 400+ others — the same `puter.ai.chat()` call. Open `ai.js` and
change the single `AI_MODEL` constant near the top of the file:

```js
const AI_MODEL = "x-ai/grok-4-1-fast"; // change to "google/gemini-3.5-flash", "openai/gpt-5.4-nano", etc.
```

See the [full model list](https://developer.puter.com/tutorials/free-llm-api/)
for other options.

---

## 🧠 How the AI Integration Works (`ai.js`)

1. `getAIRecommendations(prefs)` is the single reusable function called by
   `script.js`.
2. It builds a detailed prompt combining the user's preferences with a
   relevant sample of dishes from `data.js`, so the AI's suggestions stay
   grounded in Velora's actual menu.
3. It calls `puter.ai.chat(prompt, { model: AI_MODEL })` — Puter.js (loaded
   via `<script src="https://js.puter.com/v2/">` in `index.html`) routes
   this to Grok with no API key and no `fetch()` boilerplate.
4. The model is instructed to reply with **strict JSON only** — the
   response is parsed safely (with a fallback that strips markdown code
   fences if the model adds them).
5. The parsed array of recommendation objects is returned to `script.js`,
   which renders them as recommendation cards.
6. Any failure (Puter.js failed to load, network error, malformed response)
   throws a descriptive error that the UI displays in a friendly error
   state.

---

## 🍱 Dataset (`data.js`)

The local dataset contains **76 dishes** across 8 cuisines:

- North Indian (12)
- South Indian (10)
- Chinese (10)
- Italian (10)
- Mexican (9)
- Japanese (9)
- Desserts (8)
- Beverages (8)

Each dish object includes: `name`, `cuisine`, `type` (veg/non-veg), `meal`
type, `price`, `calories`, `spice` level, an `emoji`, and a short
`desc`ription. This dataset powers both the browsable catalog and the
context given to the AI when generating recommendations.

---

## 🔮 Future Enhancements

- Add a backend + database to support multi-device favorites and user accounts
- Add dish images instead of emoji icons
- Add a "regenerate" button to get a fresh set of AI recommendations without resubmitting the form
- Add multi-language support for menu descriptions
- Add a rating/feedback system to fine-tune future AI suggestions
- Add voice-based preference input using the Web Speech API
- Add a dark/light theme toggle
- Deploy as a Progressive Web App (PWA) for offline access to the dish catalog

---

## 👨‍💻 Author's Note

This project was built as a Computer Science mini project to demonstrate
DOM manipulation, API integration, responsive design, and client-side data
persistence — all using only foundational web technologies, without relying
on any frontend framework or backend server.
