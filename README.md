# semiplay

A modern, open-source music visualizer and synchronized listening room for YouTube Music and Spotify.

## Features
- **Real-time Room Sync**: Share a URL to listen with friends in sync.
- **YouTube Music Integration**: Pair your account to access your playlists and Liked Songs.
- **Dynamic Themes**: UI accent colors automatically adapt to the current album artwork.
- **Lyrics Support**: Synced and plain lyrics from multiple sources (LRCLIB, NetEase, lyrics.ovh).
- **TV Mode**: A distraction-free, fullscreen interface for big screens.
- **Mobile Friendly**: Optimized UI for phones and tablets.

## Quick Start

### 1. Backend Setup
```bash
cd app/server
npm install
# Create a .env file with your Google API credentials
npm start
```

### 2. Frontend Setup
```bash
cd app
bun install
bun dev
```

## Environment Variables (`app/server/.env`)
Required for YouTube account features:
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret
- `GOOGLE_REDIRECT_URI`: `http://localhost:3001/api/auth/callback`
- `FRONTEND_URL`: `http://localhost:5173` (or `4173` for preview)

## Privacy
- All authentication tokens are stored locally in your browser.
- Room sync state is kept in volatile memory and never persisted to a database.
- Zero analytics or tracking.

## License
Open-source. Provided "as-is".
