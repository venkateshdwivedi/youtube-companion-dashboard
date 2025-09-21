require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const { query, logEvent } = require('./db'); // Updated import
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Google OAuth2 Client Setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  // When deploying, this will need to be your deployed backend URL
  process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

// --- ROUTES ---

// Auth Routes
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Ensures a refresh token is provided
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    logEvent('USER_AUTHENTICATION');
    // In a real app, you would redirect to your frontend URL
    res.send('<h1>Authentication successful!</h1><p>You can close this tab and return to the application.</p>');
  } catch (error) {
    console.error('❌ Error during Google authentication:', error);
    res.status(500).send('Authentication failed.');
  }
});

// Video Routes
app.get('/video-details', async (req, res) => {
  try {
    if (!oauth2Client.credentials.access_token) return res.status(401).send('Not authenticated');
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.videos.list({
      part: 'snippet,statistics',
      id: process.env.YOUTUBE_VIDEO_ID,
    });
    if (response.data.items.length === 0) return res.status(404).send('Video not found.');
    res.json(response.data.items[0]);
  } catch (error) {
    console.error('❌ Error fetching video details:', error);
    res.status(500).send('Failed to fetch video details.');
  }
});

app.put('/video-details', async (req, res) => {
  try {
    if (!oauth2Client.credentials.access_token) return res.status(401).send('Not authenticated');
    const { title, description } = req.body;
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.videos.update({
      part: 'snippet',
      requestBody: {
        id: process.env.YOUTUBE_VIDEO_ID,
        snippet: {
          title,
          description,
          categoryId: '22',
        },
      },
    });
    logEvent('UPDATE_VIDEO_DETAILS', { title }); // LOG EVENT
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error updating video details:', error);
    res.status(500).send('Failed to update video details.');
  }
});

// Comment Routes
app.get('/comments', async (req, res) => {
  try {
    if (!oauth2Client.credentials.access_token) return res.status(401).send('Not authenticated');
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.commentThreads.list({
      part: 'snippet,replies',
      videoId: process.env.YOUTUBE_VIDEO_ID,
    });
    res.json(response.data.items);
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).send('Failed to fetch comments.');
  }
});

app.post('/comments', async (req, res) => {
  try {
    if (!oauth2Client.credentials.access_token) return res.status(401).send('Not authenticated');
    const { commentText } = req.body;
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.commentThreads.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          videoId: process.env.YOUTUBE_VIDEO_ID,
          topLevelComment: { snippet: { textOriginal: commentText } },
        },
      },
    });
    logEvent('ADD_COMMENT', { commentId: response.data.id }); // LOG EVENT
    res.status(201).json(response.data);
  } catch (error) {
    console.error('❌ Error adding comment:', error);
    res.status(500).send('Failed to add comment.');
  }
});

app.delete('/comments/:commentId', async (req, res) => {
  try {
    if (!oauth2Client.credentials.access_token) return res.status(401).send('Not authenticated');
    const { commentId } = req.params;
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    await youtube.comments.delete({ id: commentId });
    logEvent('DELETE_COMMENT', { commentId }); // LOG EVENT
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).send('Failed to delete comment.');
  }
});

// Internal Notes Routes
app.get('/notes', async (req, res) => {
  try {
    const videoId = process.env.YOUTUBE_VIDEO_ID;
    const { rows } = await query('SELECT * FROM notes WHERE video_id = $1 ORDER BY created_at DESC', [videoId]);
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching notes:', error);
    res.status(500).send('Failed to fetch notes.');
  }
});

app.post('/notes', async (req, res) => {
  try {
    const videoId = process.env.YOUTUBE_VIDEO_ID;
    const { noteText } = req.body;
    if (!noteText) return res.status(400).send('Note text cannot be empty.');
    const { rows } = await query(
      'INSERT INTO notes (video_id, note_text) VALUES ($1, $2) RETURNING *',
      [videoId, noteText]
    );
    logEvent('ADD_NOTE', { noteId: rows[0].id }); // LOG EVENT
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('❌ Error adding note:', error);
    res.status(500).send('Failed to add note.');
  }
});


// Basic home route
app.get('/', (req, res) => {
  res.send('Backend server is running! <a href="/auth/google">Login with Google</a>');
});

// Start Server
app.listen(PORT, async () => {
  try {
    const { rows } = await query('SELECT NOW()');
    console.log('PostgreSQL connected successfully at:', rows[0].now);
    console.log(`Server is listening on http://localhost:${PORT}`);
  } catch (err) {
    console.error('Failed to connect to the database.', err);
  }
});
