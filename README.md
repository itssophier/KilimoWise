# KiliMoWise · Smart AI Farm Assistant

> A mobile-first AI farm assistant for smallholder farmers. Diagnose crop and animal problems with a photo, track expenses, and get location-aware seasonal insights — works offline, supports English & Swahili.

## ✨ Features
- 🤖 AI diagnosis (Gemini multimodal) with photo + text input
- 💸 Expense tracking with monthly stats & category breakdowns
- 🌱 Seasonal, market, and tips insights tuned to the farmer's location
- 🌍 English + Swahili (i18n)
- 📱 Installable PWA, works offline for read-only flows
- 🔐 JWT auth, per-farmer scoping

## 🧪 Live demo
URLs · test farmer creds · what to try

## 🏗️ Architecture
- Backend: Spring Boot 4.0.6, Java 21, Spring Security 7, GraphQL, PostgreSQL, JPA, JWT
- Frontend: Vanilla JS, no build step, PWA (service worker + manifest), nginx
- AI: Google Gemini (`gemini-2.5-flash-lite` default, configurable)
- Infra: Render (Postgres + backend + frontend, all free tier), Docker

## 🌍 Deployment
### Render (production)
- 3 services: Postgres, backend, frontend
- Uses render.yaml (infrastructure-as-code)
- env var setup
- how to add a Gemini API key

### Docker (self-hosted)
- backend image, frontend image, optional postgres

## 📡 API
- GraphQL endpoint.
- GraphiQL UI in dev
- sample queries (analyzeProblem, getAdvisories, getInsights, addExpense)
- shape table for major types

## 🤝 Contributing
- Fork, branch, PR
- Code style notes (no comments, follow patterns)
- Test requirements
- i18n process (add a key to EN + SW)

## 🙏 Acknowledgments
- KALRO (Kenya Agricultural & Livestock Research Organization) for domain knowledge
- Google Gemini for the multimodal model
- Render for free hosting
- Farmers who tested it
