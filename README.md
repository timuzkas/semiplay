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

**docker / podman (low space mode)**
to save space on a vps (fits in < 500MB):
1. build locally: `VITE_API_URL=https://api.semi.timuzkas.xyz bun run build`
2. upload the `dist/` folder and `docker-compose.yml` to your vps.
3. run: `podman-compose up --build -d`

### environment (`app/server/.env`)
you'll need these for the youtube account sync:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (usually http://localhost:3001/api/auth/callback)
- `FRONTEND_URL` (http://localhost:5173 or 4173)

### privacy
everything auth-related stays in your localstorage. room sync data lives in the server's ram and poofs when it restarts. no analytics, no tracking.
