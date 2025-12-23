# ConqBot Panel (frontend)

## Start

```bash
npm install
npm run dev
```

## Configuration

Copy `.env.example` to `.env` and set your backend address:

```bash
cp .env.example .env
```

- `VITE_API_BASE` - backend URL (e.g. `http://localhost:4000`)
- `VITE_USE_MOCKS` - set `true` to run the panel with demo data

By default `.env.example` points to production (`https://conqbot.blcdev.com`). For local work, switch to `http://localhost:4000` and optionally set `VITE_USE_MOCKS=true`.

## Docker

```bash
docker build -t conqbot-panel .
docker run -p 8080:80 conqbot-panel
```

Override the backend during build:

```bash
docker build \
  --build-arg VITE_API_BASE=https://conqbot.blcdev.com \
  --build-arg VITE_USE_MOCKS=false \
  -t conqbot-panel .
```
