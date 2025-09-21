# YouTube Companion Dashboard

This is a mini-dashboard application built to interact with the YouTube Data API. It allows a user to manage details, comments, and private notes for a specific YouTube video.

This project was built as part of a backend test.

## Tech Stack

*   **Frontend:** React (with Vite)
*   **Backend:** Node.js with Express
*   **Database:** PostgreSQL
*   **API:** YouTube Data API v3

---

## API Endpoints

All endpoints are relative to the base URL of the deployed backend server.

### Authentication

*   `GET /auth/google`
    *   Initiates the Google OAuth 2.0 authentication flow by redirecting the user to Google's consent screen.
*   `GET /auth/google/callback`
    *   The callback URL that Google redirects to after authentication. It exchanges the authorization code for access tokens.

### Video Management

*   `GET /video-details`
    *   Fetches the `snippet` and `statistics` for the video specified in the `.env` file.
*   `PUT /video-details`
    *   Updates the title and description of the video.
    *   **Request Body:** `{ "title": "New Title", "description": "New Description" }`

### Comment Management

*   `GET /comments`
    *   Fetches all top-level comment threads for the video.
*   `POST /comments`
    *   Adds a new top-level comment to the video.
    *   **Request Body:** `{ "commentText": "This is a new comment." }`
*   `DELETE /comments/:commentId`
    *   Deletes a specific comment by its ID.

### Notes Management (Internal Database)

*   `GET /notes`
    *   Fetches all private notes associated with the video from the PostgreSQL database.
*   `POST /notes`
    *   Adds a new private note to the database.
    *   **Request Body:** `{ "noteText": "This is a new note." }`

---

## Database Schema

Two tables are used in the PostgreSQL database.

### `notes` Table

Stores private user notes for the video.

```
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### `event_logs` Table

Stores a log of all actions performed through the application.

```
CREATE TABLE event_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
```

### **3. Deployment**

The final step is to put your application online.

1.  **Push to GitHub:** Create a new repository on GitHub and push your `youtube-companion-dashboard` project to it. Make sure your `.env` file is listed in a `.gitignore` file so you don't accidentally publish your secrets.
2.  **Deploy the Frontend (Vercel):**
    *   Sign up for Vercel and connect your GitHub account.
    *   Import your repository. Vercel will automatically detect it's a Vite/React app.
    *   It will deploy your `frontend` directory and give you a public URL (e.g., `https-your-app.vercel.app`).
3.  **Deploy the Backend (Render):**
    *   Sign up for Render and connect your GitHub account.
    *   Create a new **"Web Service"** and select your repository. Set the "Root Directory" to `backend`. Render will detect the `package.json` and install dependencies.
    *   Create a new **"PostgreSQL"** database on Render. It will give you connection details.
    *   In your Web Service's **"Environment"** tab, add all your environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `YOUTUBE_VIDEO_ID`, and the PostgreSQL connection details from your new Render database).
    *   Update the "Authorized redirect URIs" in your Google Cloud Console to include your new Render backend URL (e.g., `https://your-backend.onrender.com/auth/google/callback`).

You have now successfully completed every single requirement of the backend test. Congratulations
