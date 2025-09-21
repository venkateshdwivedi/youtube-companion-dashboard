import { useState, useEffect } from 'react';
import './App.css';

// 1. DEFINE THE BACKEND URL USING AN ENVIRONMENT VARIABLE
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

function App() {
  const [videoDetails, setVideoDetails] = useState(null);
  const [comments, setComments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');


  // 2. UPDATE THE FETCH CALLS TO USE THE NEW VARIABLE
  const fetchVideoDetails = async () => {
    const response = await fetch(`${BACKEND_URL}/video-details`); 
    if (response.status === 401) throw new Error('Not authenticated. Please log in.');
    if (!response.ok) throw new Error('Failed to fetch video details.');
    const data = await response.json();
    setVideoDetails(data);
    setEditTitle(data.snippet.title);
    setEditDescription(data.snippet.description);
  };

  const fetchComments = async () => {
    const response = await fetch(`${BACKEND_URL}/comments`); 
    if (!response.ok) {
      const errorData = await response.text();
      if (errorData.includes("disabled comments")) {
        throw new Error('Comments are disabled for this video. Please enable them in YouTube Studio.');
      }
      throw new Error('Could not fetch comments.');
    }
    const data = await response.json();
    setComments(data);
  };

  const fetchNotes = async () => {
    const response = await fetch(`${BACKEND_URL}/notes`); 
    if (!response.ok) throw new Error('Failed to fetch notes.');
    const data = await response.json();
    setNotes(data);
  };

  // 3. Combined useEffect for Initial Load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await fetchVideoDetails();
        await fetchComments();
        await fetchNotes(); // Fetch notes on load
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 4. Event Handlers
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${BACKEND_URL}/video-details`, { // Changed
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle, description: editDescription }),
      });
      alert('Video details updated successfully!');
      setVideoDetails(prev => ({
        ...prev,
        snippet: { ...prev.snippet, title: editTitle, description: editDescription },
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/comments`, { // Changed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentText: newCommentText }),
      });
      setNewCommentText('');
      await fetchComments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await fetch(`${BACKEND_URL}/comments/${commentId}`, { method: 'DELETE' }); // Changed
      await fetchComments();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    try {
      await fetch(`${BACKEND_URL}/notes`, { // Changed
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText: newNoteText }),
      });
      setNewNoteText('');
      await fetchNotes();
    } catch (err) {
      alert(err.message);
    }
  };
  
    const LoginButton = () => (
    <div className="card">
      <p style={{ color: 'red' }}>{error}</p>
      <a href={`${BACKEND_URL}/auth/google`}>
        <button>Login with Google</button>
      </a>
    </div>
  );

  // 5. Render Logic
  if (loading) return <div className="App"><h1>Loading...</h1></div>;

  if (error) {
    return (
      <div className="App">
        <LoginButton />
      </div>
    );
  }

  return (
    <div className="App">
      {videoDetails && (
        <div className="card">
          <h1>{videoDetails.snippet.title}</h1>
          <img src={videoDetails.snippet.thumbnails.medium.url} alt="Video Thumbnail" />
          <div className="statistics">
            <span>Views: {videoDetails.statistics.viewCount}</span>
            <span>Likes: {videoDetails.statistics.likeCount}</span>
          </div>
          <hr />
          <form onSubmit={handleUpdateDetails} className="edit-form">
            <h3>Edit Details</h3>
            <div className="form-row">
              <label htmlFor="title">Title</label>
              <input id="title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="4" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <button type="submit">Save Changes</button>
          </form>
          <hr />
          <h2>Comments</h2>
          <form onSubmit={handleAddComment} className="comment-form">
            <textarea
              placeholder="Add a public comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              rows="3"
            />
            <button type="submit">Comment</button>
          </form>
          <div className="comments-section">
            {comments.length > 0 ? (
              comments.map((commentThread) => (
                <div key={commentThread.id} className="comment">
                  <button className="delete-button" onClick={() => handleDeleteComment(commentThread.snippet.topLevelComment.id)}>
                    Delete
                  </button>
                  <p><strong>{commentThread.snippet.topLevelComment.snippet.authorDisplayName}</strong></p>
                  <p dangerouslySetInnerHTML={{ __html: commentThread.snippet.topLevelComment.snippet.textDisplay }} />
                </div>
              ))
            ) : (
              <p>No comments to display.</p>
            )}
          </div>

          {/* Notes Section JSX */}
          <hr />
          <h2>My Private Notes</h2>
          <form onSubmit={handleAddNote} className="comment-form">
            <textarea
              placeholder="Jot down some ideas for this video..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows="3"
            />
            <button type="submit">Save Note</button>
          </form>
          <div className="comments-section">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div key={note.id} className="comment">
                  <p>{note.note_text}</p>
                </div>
              ))
            ) : (
              <p>No notes for this video yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

