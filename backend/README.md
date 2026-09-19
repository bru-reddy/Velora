# Velora API

Production backend for Velora's Gemini-powered recommendation engine.

## Local setup

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Add your Gemini API key to `GEMINI_API_KEY`.
4. Install dependencies with `npm install`.
5. Start the server with `npm start`.

The API runs on `http://localhost:10000`.

## Endpoints

- `GET /` — service information
- `GET /health` — health check
- `POST /api/recommendations` — personalized recommendations

Security includes Helmet, compression, CORS, request-size limits, and rate limiting. The Gemini key is read from the server environment and is never sent to the browser.
