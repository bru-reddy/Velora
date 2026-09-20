/* =========================================================
   ai.js — Velora AI client
   -----------------------------------------------------------
   The browser talks only to Velora's backend API.
   The Gemini API key is kept on the server and is never exposed
   in this public frontend.
   ========================================================= */

const DEFAULT_API_URL = "https://velora-api-pgey.onrender.com";

function getApiBaseUrl() {
  if (window.VELORA_API_URL) {
    return window.VELORA_API_URL.replace(/\/$/, "");
  }

  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:10000";
  }

  return DEFAULT_API_URL;
}

function filterDishesForContext(prefs) {
  let pool = DISH_DATA.slice();

  if (prefs.dietType === "Vegetarian") {
    pool = pool.filter((dish) => dish.type === "veg");
  }

  if (prefs.cuisine && prefs.cuisine !== "Any") {
    const cuisineMatches = pool.filter((dish) => dish.cuisine === prefs.cuisine);
    if (cuisineMatches.length > 0) pool = cuisineMatches;
  }

  return pool.slice(0, 40);
}

function validateRecommendations(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length !== 6) {
    throw new Error("The AI returned an incomplete recommendation set. Please try again.");
  }

  return recommendations.map((rec) => ({
    name: String(rec.name || "Recommended dish").trim(),
    cuisine: String(rec.cuisine || "").trim(),
    description: String(rec.description || "").trim(),
    price: Number.isFinite(Number(rec.price)) ? Number(rec.price) : null,
    calories: Number.isFinite(Number(rec.calories)) ? Number(rec.calories) : null,
    reason: String(rec.reason || "").trim(),
    healthScore: Math.min(10, Math.max(1, Math.round(Number(rec.healthScore) || 5))),
    emoji: rec.emoji || "✨",
  }));
}

window.getAIRecommendations = async function getAIRecommendations(prefs) {
  const apiUrl = getApiBaseUrl();
  const menu = filterDishesForContext(prefs);

  let response;

  try {
    response = await fetch(apiUrl + "/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preferences: prefs,
        menu,
      }),
    });
  } catch (error) {
    console.error("Velora API network error:", error);
    throw new Error(
      "Velora's AI service could not be reached. Please check your connection and try again."
    );
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch (_error) {
    throw new Error("Velora's AI service returned an unexpected response.");
  }

  if (!response.ok) {
    const baseMessage =
      payload?.error || "Velora's AI service is temporarily unavailable. Please try again.";
    const diagnostic = payload?.diagnostic ? String(payload.diagnostic) : "";
    throw new Error(diagnostic ? baseMessage + " " + diagnostic : baseMessage);
  }

  return validateRecommendations(payload.recommendations);
}
