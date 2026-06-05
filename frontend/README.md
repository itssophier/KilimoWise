# KiliMoWise Frontend

Smart AI Farm Assistant — a mobile-first PWA for farmers.

## Tech Stack
- Vanilla JavaScript
- HTML5 + CSS3
- GraphQL API
- PWA (manifest + service worker)

## Quick Start

1. **Serve the frontend** (any static server):

```bash
# Python
python -m http.server 3000

# Node
npx serve .

# PHP
php -S localhost:3000
```

2. **Update API URL** (if backend isn't on localhost:8080):

Edit `config.js`:
```js
window.APP_CONFIG = {
  GRAPHQL_URL: 'https://your-backend.com/graphql'
};
```

## Docker

```bash
# Build
docker build -t kilimowise-frontend .

# Run
docker run -p 80:80 \
  -e GRAPHQL_URL=https://your-backend.com/graphql \
  kilimowise-frontend
```

## Deploy to Render

1. Create a new **Static Site** on Render
2. Set build command to empty
3. Set publish directory to `frontend/`
4. Add env var: `GRAPHQL_URL`

Or use Docker deployment:
1. Create a **Web Service**
2. Use the Dockerfile
3. Set env var `GRAPHQL_URL`

## Project Structure

```
frontend/
├── config.js          # API endpoint (single source of truth)
├── index.html         # Dashboard
├── login.html         # Login / Register
├── advisor.html       # AI Diagnosis
├── budget.html        # Expense Tracker
├── insights.html      # Farming Intelligence
├── css/style.css      # Mobile-first styles
├── js/
│   ├── api.js         # GraphQL calls only
│   ├── auth.js        # Login/session
│   ├── i18n.js        # English + Swahili
│   ├── utils.js       # Formatting, toasts, history
│   ├── dashboard.js   # Dashboard logic
│   ├── advisor.js     # AI advisor logic
│   ├── budget.js      # Budget tracker logic
│   └── insights.js    # Insights logic
├── manifest.json      # PWA manifest
├── service-worker.js  # PWA service worker
├── Dockerfile         # nginx:alpine deployment
├── nginx.conf         # nginx config
└── README.md
```

## Language Support
- English (default)
- Swahili
- Toggle via header button (EN/SW)

## Offline Support
- Budget page works fully offline (localStorage fallback)
- Insights shows cached data when offline
- App shell cached via service worker
