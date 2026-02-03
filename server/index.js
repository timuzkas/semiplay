const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { google } = require('googleapis');
const youtubesearchapi = require('youtube-search-api');

const app = express();
const server = http.createServer(app);

// OAuth2 Client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/callback'
);

const SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];

app.use(cors());
app.use(express.json());

// OAuth Routes
app.get('/api/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.redirect(`http://localhost:5173/#yt_access_token=${tokens.access_token}`);
  } catch (error) {
    res.redirect('http://localhost:5173/?error=auth_failed');
  }
});

app.get('/api/youtube/playlists', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  oauth2Client.setCredentials({ access_token: token });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  try {
    const response = await youtube.playlists.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 25,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/youtube/playlistItems', async (req, res) => {
  const { playlistId } = req.query;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  oauth2Client.setCredentials({ access_token: authHeader.split(' ')[1] });

  const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
  try {
    const response = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId,
      maxResults: 50,
    });
    
    const tracks = response.data.items.map(item => ({
      id: item.contentDetails.videoId,
      name: item.snippet.title,
      artist: item.snippet.videoOwnerChannelTitle || 'YouTube Music',
      artwork: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.high?.url,
      source: 'youtube'
    }));

    res.json({ items: tracks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rooms storage (in-memory)
const rooms = new Map();

// Socket.io logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Send current state if room exists
    if (rooms.has(roomId)) {
      socket.emit('sync-state', rooms.get(roomId));
    } else {
      // If room is new or state is missing, ask others for state
      socket.to(roomId).emit('request-state', { requester: socket.id });
    }
  });

  socket.on('update-state', ({ roomId, state }) => {
    // Merge sender ID into state for client-side filtering
    const fullState = { ...state, sender: socket.id };
    rooms.set(roomId, fullState);
    socket.to(roomId).emit('sync-state', fullState);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

// YouTube search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const response = await youtubesearchapi.GetListByKeyword(
      query,
      false,
      limit,
      [{ type: 'video' }]
    );

    if (response && response.items) {
      const tracks = response.items
        .filter((item) => item.type === 'video' && item.id)
        .map((item) => ({
          id: item.id,
          name: item.title || 'Unknown Title',
          artist: item.channelTitle || 'Unknown Artist',
          album: 'YouTube Music',
          duration: item.length?.simpleText 
            ? parseDuration(item.length.simpleText)
            : 0,
          artwork: item.thumbnail?.thumbnails?.[0]?.url || 
                  `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`,
          source: 'youtube',
        }));

      res.json({ items: tracks, nextPage: response.nextPage });
    } else {
      res.json({ items: [], nextPage: null });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

function parseDuration(durationStr) {
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 2) {
    return (parts[0] * 60 + parts[1]) * 1000;
  } else if (parts.length === 3) {
    return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  }
  return 0;
}

server.listen(PORT, () => {
  console.log(`semiplay server running on port ${PORT}`);
});
