# ConqBot Panel (frontend)

## Start

```bash
npm install
npm run dev
```

## Konfiguracja

Skopiuj `.env.example` do `.env` i ustaw adres backendu ConqBot:

```bash
cp .env.example .env
```

- `VITE_API_BASE` - adres backendu (np. `http://localhost:4000`)
- `VITE_USE_MOCKS` - ustaw `true`, aby uruchomic panel z lokalnymi danymi demo

Domyslnie `.env.example` wskazuje produkcje (`https://conqbot.blcdev.com`). Do pracy lokalnej zmien `VITE_API_BASE` na `http://localhost:4000` i (opcjonalnie) ustaw `VITE_USE_MOCKS=true`.

## Docker

```bash
docker build -t conqbot-panel .
docker run -p 8080:80 conqbot-panel
```

Mozesz nadpisac backend podczas buildu:

```bash
docker build \\
  --build-arg VITE_API_BASE=https://conqbot.blcdev.com \\
  --build-arg VITE_USE_MOCKS=false \\
  -t conqbot-panel .
```
