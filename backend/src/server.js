import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";


const app = express();
const PORT = Number(process.env.PORT) || 10000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "";

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not configured. AI recommendations will be unavailable.");
}

// Keep the deployed GitHub Pages frontend allowed even if Render's
// FRONTEND_ORIGIN environment variable is missing or stale.
const configuredOrigins = FRONTEND_ORIGIN
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const allowedOrigins = new Set([
  "https://bru-reddy.github.io",
  "https://velora-frontend-lx66.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000",
  ...configuredOrigins,
]);

const allowAllOrigins = FRONTEND_ORIGIN.trim() === "*";

const corsOptions = {
  origin: function (origin, callback) {
    // Requests without an Origin header (health checks, curl, server-to-server)
    // are allowed. Browser origins must be explicitly allowlisted.
    if (!origin || allowAllOrigins || allowedOrigins.has(origin.replace(/\/$/, ""))) {
      callback(null, true);
      return;
    }

    callback(new Error("Origin is not allowed by Velora API CORS policy."));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  optionsSuccessStatus: 204,
  credentials: false,
};

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// CORS must run before the JSON parser and API routes so GitHub Pages
// preflight (OPTIONS) requests receive the required headers.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "32kb" }));

const recommendationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many recommendation requests. Please try again later." }
});

const recommendationSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          cuisine: { type: "string" },
          description: { type: "string" },
          price: { type: "integer" },
          calories: { type: "integer" },
          reason: { type: "string" },
          healthScore: { type: "integer" }
        },
        required: ["name", "cuisine", "description", "price", "calories", "reason", "healthScore"],
        additionalProperties: false
      }
    }
  },
  required: ["recommendations"],
  additionalProperties: false
};

const VALID_DIETS = new Set(["Vegetarian", "Non-Vegetarian"]);
const VALID_MEALS = new Set(["breakfast", "lunch", "dinner", "snack", "dessert", "beverage"]);

function normalizePreferences(body = {}) {
  const budget = Number(body.budget);
  const spiceLevel = Number(body.spiceLevel);

  return {
    dietType: String(body.dietType || "Vegetarian").trim(),
    cuisine: String(body.cuisine || "Any").trim(),
    budget: Number.isFinite(budget) ? Math.min(400, Math.max(40, budget)) : 250,
    spiceLevel: Number.isFinite(spiceLevel) ? Math.min(3, Math.max(0, spiceLevel)) : 1,
    mealType: String(body.mealType || "lunch").trim().toLowerCase(),
    calories: String(body.calories || "No preference").trim(),
    allergies: String(body.allergies || "").trim().slice(0, 300),
    mood: String(body.mood || "Comfort seeking").trim().slice(0, 120)
  };
}

function validatePreferences(prefs) {
  if (!VALID_DIETS.has(prefs.dietType)) return "Invalid diet type.";
  if (!VALID_MEALS.has(prefs.mealType)) return "Invalid meal type.";
  return null;
}

function buildPrompt(prefs, menu) {
  const menuContext = menu.slice(0, 40).map(function (dish) {
    return "- " + dish.name + " | " + dish.cuisine + " | " + dish.type + " | " +
      dish.meal + " | ₹" + dish.price + " | " + dish.calories + " kcal | spice " + dish.spice + "/3";
  }).join("\n");

  return [
    "You are Velora's recommendation engine.",
    "",
    "Recommend exactly 6 dishes from the provided Velora menu context.",
    "Prefer dishes from the menu instead of inventing dishes.",
    "The recommendation must satisfy dietary restrictions, allergy exclusions, budget, meal type, calorie preference, cuisine preference, spice preference, and mood.",
    "",
    "CUSTOMER:",
    "- Diet: " + prefs.dietType,
    "- Cuisine: " + prefs.cuisine,
    "- Maximum budget: ₹" + prefs.budget,
    "- Spice level: " + prefs.spiceLevel + "/3",
    "- Meal: " + prefs.mealType,
    "- Calories: " + prefs.calories,
    "- Allergies/exclusions: " + (prefs.allergies || "none"),
    "- Mood: " + prefs.mood,
    "",
    "VELORA MENU:",
    menuContext,
    "",
    "RULES:",
    "1. Return exactly 6 recommendations.",
    "2. Never recommend a dish that conflicts with the diet or listed allergies.",
    "3. Prefer menu items whose price is within the customer's budget.",
    "4. Prefer the requested cuisine and meal type when matching items exist.",
    "5. Use the menu's price and calorie values for menu items.",
    "6. Keep descriptions concise and appetizing.",
    "7. Explain why each dish matches the customer's preferences.",
    "8. Health score is a general nutritional indicator, not medical advice.",
    "9. Return only the requested structured JSON."
  ].join("\n");
}

function sanitizeRecommendations(payload, menu) {
  const menuByName = new Map(menu.map(function (dish) {
    return [dish.name.toLowerCase(), dish];
  }));

  return payload.recommendations.map(function (rec) {
    const menuDish = menuByName.get(String(rec.name).toLowerCase());

    return {
      name: String(rec.name).trim().slice(0, 100),
      cuisine: String(rec.cuisine).trim().slice(0, 60),
      description: String(rec.description).trim().slice(0, 240),
      price: menuDish ? menuDish.price : Math.max(0, Math.round(Number(rec.price) || 0)),
      calories: menuDish ? menuDish.calories : Math.max(0, Math.round(Number(rec.calories) || 0)),
      reason: String(rec.reason).trim().slice(0, 320),
      healthScore: Math.min(10, Math.max(1, Math.round(Number(rec.healthScore) || 5))),
      emoji: menuDish ? menuDish.emoji : "✨"
    };
  });
}

app.get("/", function (_req, res) {
  res.json({ service: "Velora API", status: "ok", version: "1.0.0" });
});

app.get("/health", function (_req, res) {
  res.json({
    status: "healthy",
    aiConfigured: Boolean(GROQ_API_KEY),
    provider: "groq",
    model: GROQ_MODEL,
    timestamp: new Date().toISOString()
  });
});

app.post("/api/recommendations", recommendationLimiter, async function (req, res) {
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: "AI service is not configured on the server." });
  }

  const body = req.body || {};
  const preferences = body.preferences;
  const menu = body.menu;

  if (!preferences || !Array.isArray(menu) || menu.length === 0) {
    return res.status(400).json({ error: "Preferences and a non-empty menu are required." });
  }

  const prefs = normalizePreferences(preferences);
  const validationError = validatePreferences(prefs);
  if (validationError) return res.status(400).json({ error: validationError });

  const safeMenu = menu.slice(0, 76).map(function (dish) {
    return {
      name: String(dish.name || "").slice(0, 100),
      cuisine: String(dish.cuisine || "").slice(0, 60),
      type: String(dish.type || "").slice(0, 30),
      meal: String(dish.meal || "").slice(0, 30),
      price: Number(dish.price) || 0,
      calories: Number(dish.calories) || 0,
      spice: Number(dish.spice) || 0,
      emoji: String(dish.emoji || "🍽️").slice(0, 8)
    };
  });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + GROQ_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are Velora's recommendation engine. Follow the user's preferences and return exactly 6 menu recommendations. Use only dishes from the supplied Velora menu. Never recommend a dish that conflicts with the diet or allergies. Return only JSON matching the supplied schema."
          },
          {
            role: "user",
            content: buildPrompt(prefs, safeMenu)
          }
        ],
        temperature: 0.4,
        max_completion_tokens: 2048,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "velora_recommendations",
            strict: true,
            schema: recommendationSchema
          }
        }
      })
    });

    const responseText = await response.text();
    let payload = null;

    try {
      payload = JSON.parse(responseText);
    } catch (_error) {
      payload = null;
    }

    if (!response.ok) {
      const providerMessage = payload?.error?.message || payload?.error?.error || responseText;
      const error = new Error(String(providerMessage || "Groq request failed."));
      error.status = response.status;
      throw error;
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty response.");

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_error) {
      throw new Error("Groq returned invalid JSON.");
    }

    if (!parsed || !Array.isArray(parsed.recommendations) || parsed.recommendations.length !== 6) {
      throw new Error("Groq returned an invalid recommendation set.");
    }

    return res.json({
      recommendations: sanitizeRecommendations(parsed, safeMenu),
      model: GROQ_MODEL,
      provider: "groq"
    });
  } catch (error) {
    const status = Number(error?.status || 0);
    const message = String(error?.message || "Groq request failed.");

    console.error("Velora Groq request failed:", {
      status,
      message
    });

    let diagnostic = status
      ? "Groq API error (HTTP " + status + ")."
      : "Groq request failed.";

    if (status === 401 || status === 403) {
      diagnostic = "Groq authentication or API access failed. Check the Render GROQ_API_KEY.";
    } else if (status === 429) {
      diagnostic = "Groq rate limit or quota was exceeded.";
    } else if (status >= 500) {
      diagnostic = "Groq returned a server-side error (HTTP " + status + ").";
    }

    const safeMessage = message
      .replace(/gsk_[0-9A-Za-z_-]+/g, "[redacted]")
      .replace(/https?:\/\/[^\s]+/g, "[url redacted]")
      .slice(0, 300);

    return res.status(502).json({
      error: "The AI recommendation service is temporarily unavailable.",
      diagnostic: safeMessage ? diagnostic + " " + safeMessage : diagnostic
    });
  }
});

app.use(function (err, _req, res, _next) {
  console.error("Unhandled server error:", err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, "0.0.0.0", function () {
  console.log("Velora API listening on port " + PORT);
});
