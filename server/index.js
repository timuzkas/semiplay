const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const youtubesearchapi = require('youtube-search-api');

const app = express();
const server = http.createServer(app);
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
