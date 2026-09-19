# Velora — AI-Powered Personalized Menu Recommendation System

Velora is a personalized food discovery application that combines a curated menu dataset with Gemini AI to recommend dishes based on diet, cuisine, budget, spice level, meal type, calorie preference, allergies, and mood.

## Architecture

Browser / GitHub Pages
        |
        | POST /api/recommendations
        v
Velora API / Render
        |
        | @google/genai
        v
Google Gemini API

The Gemini API key is stored only on the backend and is never shipped to the browser.

## Features

- Search across the menu
- Cuisine filtering
- Personalized AI recommendations
- Dietary and allergy-aware prompts
- Budget, calorie, spice, meal, and mood preferences
- Health-score visualization
- Local favorites
- Responsive UI
- Structured Gemini JSON output
- Backend validation and sanitization
- Rate limiting
- CORS protection
- Security headers
- Compression
- Render deployment configuration
- Health-check endpoint

## Repository structure

Velora/
├── index.html
├── style.css
├── script.js
├── ai.js
├── data.js
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── README.md
│   └── src/server.js
├── render.yaml
├── .gitignore
└── README.md

## Local setup

Frontend:

    python -m http.server 5500

Backend:

    cd backend
    copy .env.example .env
    npm install
    npm start

Set these backend environment variables:

    GEMINI_API_KEY=your_key_here
    GEMINI_MODEL=gemini-3.8-flash
    FRONTEND_ORIGIN=http://localhost:5500
    PORT=10000

The API runs at http://localhost:10000 and exposes /health and /api/recommendations.

## Production deployment

The repository includes render.yaml for the backend.

1. Deploy the repository's backend service to Render.
2. Use backend as the service root directory.
3. Use npm install as the build command and npm start as the start command.
4. Add GEMINI_API_KEY as a Render secret.
5. Set GEMINI_MODEL to gemini-3.8-flash.
6. Set FRONTEND_ORIGIN to the deployed frontend origin.
7. Verify the /health endpoint.

Google's current JavaScript SDK is @google/genai. Google documents server-side API-key usage through environment variables and structured JSON output through response schemas.

## Security

The backend uses Helmet, CORS restrictions, compression, JSON request-size limits, rate limiting, input normalization, model-output validation, and sanitized API errors.

The Gemini key is never stored in index.html, ai.js, GitHub Pages, or other public frontend files.

## Roadmap

- User authentication
- PostgreSQL persistence
- Cloud favorites
- Recommendation history
- Feedback and ratings
- Regenerate recommendations
- Advanced filtering
- Restaurant/menu administration
- Analytics
- PWA support
- Automated tests
- CI/CD
- Structured logging and observability
- Accessibility improvements
- Richer dish imagery and metadata

## Technology stack

Frontend: HTML5, CSS3, vanilla JavaScript, Local Storage
Backend: Node.js, Express, Google Gen AI SDK, Gemini, Helmet, CORS, Compression, Express Rate Limit
Deployment: GitHub Pages + Render

## Author

Velora is a Computer Science project focused on frontend engineering, backend API design, AI integration, validation, security fundamentals, and deployment.