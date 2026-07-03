/* =========================================================
   ai.js — AI Integration for Velora (Puter.js + Grok)
   -----------------------------------------------------------
   This file is responsible ONLY for talking to the AI model.
   It exposes one reusable async function, getAIRecommendations(),
   which script.js calls whenever the user submits the preference
   form.

   Why Puter.js instead of a direct Gemini/OpenAI/xAI fetch call?
   Calling a provider's REST API straight from the browser means
   either shipping a secret API key inside public source code
   (anyone can open DevTools and steal it) or forcing every visitor
   to create their own developer account and paste in a key. Neither
   fits a static, no-backend student project.

   Puter.js (https://puter.com) solves this with a "User-Pays" model:
   it's a single <script> tag (loaded in index.html) that proxies
   requests to 400+ models — including xAI's Grok, Google Gemini,
   OpenAI, and Claude — with NO API key required from the developer
   at all. The first time a visitor's browser calls puter.ai.chat(),
   Puter may show a quick, free one-time sign-in popup so usage is
   tied to that visitor instead of to Velora's source code. There is
   nothing to paste, configure, or keep secret.

   How it works:
   1. Build a detailed natural-language prompt from the user's
      preferences + a sample of the local dish dataset (data.js)
      so the AI has real menu context to reason about.
   2. Ask the model to reply ONLY in strict JSON (no markdown).
   3. Parse the JSON safely and return an array of recommendation
      objects to the caller.
   4. If anything fails (Puter not loaded, network error, malformed
      JSON) throw a clear error so script.js can show a friendly
      error state instead of crashing.
   ========================================================= */

/* -------------------------------------------------------------
   AI_MODEL — the only line you need to touch to switch providers.
   Puter.js gives every model the exact same puter.ai.chat() call,
   so "some other AI" is a one-line change, not a rewrite:

     "x-ai/grok-4-1-fast"     -> Grok 4.1 Fast (xAI)  [default: fast + cheap]
     "x-ai/grok-4.3"          -> Grok 4.3 (xAI)        [flagship, slower]
     "google/gemini-3.5-flash"-> Gemini 3.5 Flash (Google)
     "openai/gpt-5.4-nano"    -> GPT-5.4 Nano (OpenAI)
     "anthropic/claude-sonnet-4-6" -> Claude Sonnet 4.6 (Anthropic)

   Full list: https://developer.puter.com/tutorials/free-llm-api/
   ------------------------------------------------------------- */
const AI_MODEL = "x-ai/grok-4-1-fast";

/**
 * Builds the natural-language instruction prompt sent to the AI.
 * We include a short slice of the local dataset so the AI grounds
 * its suggestions in dishes Velora actually knows about, while
 * still allowing it to add general knowledge/explanations.
 *
 * @param {Object} prefs - user preference object from the form
 * @param {Array}  sampleDishes - a filtered sample from DISH_DATA
 * @returns {string} the full prompt text
 */
function buildPrompt(prefs, sampleDishes) {
  // Turn the sample dishes into a compact readable menu list
  const menuContext = sampleDishes
    .map(
      (d) =>
        `- ${d.name} | ${d.cuisine} | ${d.type} | ${d.meal} | ₹${d.price} | ${d.calories} kcal | spice level ${d.spice}/3`
    )
    .join("\n");

  return `
You are Velora, an expert AI restaurant menu consultant. A customer has shared their food preferences below. Recommend exactly 6 dishes that best match their preferences, drawing from the reference menu when a good match exists, and using your own culinary knowledge to fill in or enrich the suggestions when needed.

CUSTOMER PREFERENCES:
- Diet type: ${prefs.dietType}
- Preferred cuisine: ${prefs.cuisine}
- Budget: up to ₹${prefs.budget} per dish
- Spice level preference (0=mild, 1=low, 2=medium, 3=high): ${prefs.spiceLevel}
- Meal type: ${prefs.mealType}
- Calorie preference: ${prefs.calories}
- Allergies to strictly avoid: ${prefs.allergies || "none"}
- Current mood: ${prefs.mood}

REFERENCE MENU (a sample from Velora's dataset):
${menuContext}

INSTRUCTIONS:
1. Recommend exactly 6 dishes suited to the preferences above.
2. Strictly respect the diet type and allergy restrictions — never suggest a dish that conflicts with them.
3. Give a short, warm, personalized reason (1-2 sentences) for EACH recommendation, referencing the customer's mood/preferences.
4. Assign a "healthScore" from 1-10 (10 = extremely healthy/balanced) based on the dish's likely nutrition.
5. Reply with ONLY valid JSON — no markdown fences, no commentary, no extra text before or after.

Respond in EXACTLY this JSON structure:
{
  "recommendations": [
    {
      "name": "Dish Name",
      "cuisine": "Cuisine type",
      "description": "Short appetizing description (max 20 words)",
      "price": 199,
      "calories": 350,
      "reason": "Personalized AI reason for this recommendation",
      "healthScore": 7
    }
  ]
}
`.trim();
}

/**
 * Safely extracts and parses the JSON object the AI returned,
 * even if it accidentally wraps it in markdown code fences.
 * @param {string} rawText
 * @returns {Object} parsed JSON
 */
function extractJSON(rawText) {
  let cleaned = rawText.trim();

  // Strip ```json ... ``` or ``` ... ``` fences if present
  cleaned = cleaned.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();

  // As a safety net, isolate text between the first { and the last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Calls the AI model through Puter.js and returns the generated
 * raw text response. No API key, no fetch(), no backend — Puter.js
 * (loaded as a <script> tag in index.html) handles auth and billing
 * on the visitor's own free Puter account.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callPuterAI(prompt) {
  if (typeof puter === "undefined" || !puter.ai || !puter.ai.chat) {
    throw new Error(
      "The AI engine failed to load (Puter.js). Check your internet connection and reload the page."
    );
  }

  let response;
  try {
    response = await puter.ai.chat(prompt, {
      model: AI_MODEL,
      temperature: 0.8,
      max_tokens: 1500,
    });
  } catch (err) {
    throw new Error(err?.message || "The AI request failed. Please try again.");
  }

  const text = response?.message?.content ?? response?.text ?? (typeof response === "string" ? response : null);

  if (!text) {
    throw new Error("The AI returned an empty response. Please try again.");
  }

  return text;
}

/**
 * MAIN REUSABLE FUNCTION
 * Generates personalized dish recommendations using the AI model
 * based on the user's submitted preferences.
 *
 * @param {Object} prefs - {
 *   dietType, cuisine, budget, spiceLevel, mealType,
 *   calories, allergies, mood
 * }
 * @returns {Promise<Array>} array of recommendation objects
 */
async function getAIRecommendations(prefs) {
  // Build a relevant sample of dishes from the local dataset to ground the AI
  const sampleDishes = filterDishesForContext(prefs);

  const prompt = buildPrompt(prefs, sampleDishes);
  const rawText = await callPuterAI(prompt);

  let parsed;
  try {
    parsed = extractJSON(rawText);
  } catch (err) {
    console.error("Failed to parse AI response:", rawText);
    throw new Error("AI returned an unexpected format. Please try again.");
  }

  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error("AI response did not include valid recommendations.");
  }

  return parsed.recommendations;
}

/**
 * Picks a relevant subset (max 20) of DISH_DATA to include as
 * context in the prompt, based loosely on cuisine/diet, so the
 * prompt stays short while still being useful.
 * @param {Object} prefs
 * @returns {Array}
 */
function filterDishesForContext(prefs) {
  let pool = DISH_DATA.slice();

  if (prefs.dietType === "Vegetarian") {
    pool = pool.filter((d) => d.type === "veg");
  }

  if (prefs.cuisine && prefs.cuisine !== "Any") {
    const cuisineMatches = pool.filter((d) => d.cuisine === prefs.cuisine);
    if (cuisineMatches.length > 0) pool = cuisineMatches;
  }

  // Shuffle lightly and cap at 20 items to keep prompt concise
  return pool.sort(() => Math.random() - 0.5).slice(0, 20);
}
