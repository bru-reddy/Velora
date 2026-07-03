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



## 👨‍💻 Author's Note

This project was built as a Computer Science mini project to demonstrate
DOM manipulation, API integration, responsive design, and client-side data
persistence — all using only foundational web technologies, without relying
on any frontend framework or backend server.
