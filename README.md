# semiplay

modern music visualizer and synced rooms for youtube music and spotify. it auto-grabs accent colors from album art, handles lyrics from a few different places, and has a tv mode for when you just want to sit back. it's open source and doesn't track you.

### setup

**backend**
```bash
cd app/server
npm install
# add your google api keys to .env
npm start
```

**frontend**
```bash
cd app
bun install
bun dev
```

**docker / podman**
```bash
# using docker
docker compose up --build -d

# using podman
podman-compose up --build -d
# or
podman compose up --build -d
```

### environment (`app/server/.env`)
you'll need these for the youtube account sync:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (usually http://localhost:3001/api/auth/callback)
- `FRONTEND_URL` (http://localhost:5173 or 4173)

### privacy
everything auth-related stays in your localstorage. room sync data lives in the server's ram and poofs when it restarts. no analytics, no tracking.
