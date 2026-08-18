# AI Chat Assistant

A full-stack AI chat application built with React, TypeScript, Vite, Node.js/Express, MongoDB, and Google's Gemini API. Supports real-time streaming responses, web-grounded citations, response regeneration, and persistent conversation history.

**Repository:** https://github.com/Nivo203/ai-chat

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Server-Sent Events (SSE) |
| Database | MongoDB |
| AI | Google Gemini API (Gemini 3.5 Flash Lite) with Google Search grounding |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [MongoDB](https://www.mongodb.com/try/download/community) running locally (Windows) — default connection assumed at `mongodb://localhost:27017`
- A [Google Gemini API key](https://ai.google.dev/)

## Setup (under 5 minutes)

### 1. Clone the repository

```bash
git clone https://github.com/Nivo203/ai-chat.git
cd ai-chat
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/ai-chat
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```bash
npm run dev
```

Confirm it's running by visiting:

```
http://localhost:3001/health
```

### 3. Frontend setup

Open a new terminal:

```bash
cd ai-chat
npm install
npm run dev
```

The app will be available at:

```
http://localhost:5173
```

### 4. Make sure MongoDB is running

On Windows, make sure the MongoDB service is running before starting the backend (`services.msc` → MongoDB, or run `mongod` from a terminal).

## Verifying the Setup

1. Open `http://localhost:5173` in your browser.
2. Send a message in the chat.
3. Watch the response stream in with citations.
4. Try regenerating a response and switching versions.
5. Give feedback with the thumbs up/down control.
6. Refresh the page and confirm your conversation reloads from the thread list.

## Project Structure

```
ai-chat/
├── ai/          # Custom AI skill/agent instructions
├── backend/     # Express + TypeScript API, Gemini integration, MongoDB models
├── public/      # Static assets
├── src/         # React + TypeScript frontend
└── README.md
```

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `PORT` | backend | Port the Express server runs on (default 3001) |
| `MONGODB_URI` | backend | MongoDB connection string |
| `GEMINI_API_KEY` | backend | API key for Google's Gemini API |

`backend/.env` is excluded from version control via `.gitignore` — never commit real API keys.

## Notes

- If the AI stops generating responses, check the backend logs for a `429 RESOURCE_EXHAUSTED` error — this indicates the Gemini API quota has been reached and is unrelated to the application code.
- The custom AI skill/agent instructions used during development are checked into the `ai/` directory.
