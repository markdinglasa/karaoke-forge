# Karaoke Forge

Welcome to the Karaoke Forge project! This is an AI-powered application designed to automatically create karaoke videos by synchronizing audio with lyrics.

This project uses a Next.js application for the frontend UI and video processing, backed by a FastAPI Python service for advanced AI audio synchronization using OpenAI's Whisper.

## Project Architecture

The repository is structured into two main components:

1. **`karaoke-app/`** (Frontend)
   - A modern Next.js React application.
   - Handles the user interface, file uploads, state management, and video preview/generation.
   - Uses `ffmpeg-static` for media handling.

2. **`sync_service/`** (Backend)
   - A Python FastAPI backend.
   - Provides `/transcribe` and `/align` endpoints.
   - Integrates `openai-whisper` for highly accurate lyric alignment, fuzzy matching, and timestamp generation.

---

## Getting Started Guide

Follow these steps to initialize and start the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- Python 3.10+
- (Optional but recommended) FFmpeg installed on your system.

### Step 1: Start the Sync Service (Backend)

The synchronization service needs to run in the background to handle audio transcription and alignment.

```bash
cd sync_service

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app:app --port 8000
```

> **Tip:** If the port is busy, you can use `pkill -f "uvicorn app:app"` to kill the existing process before starting.

The backend API will now be running at `http://localhost:8000`.

### Step 2: Start the Karaoke App (Frontend)

Now, start the Next.js frontend application.

```bash
cd karaoke-app

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to use the application.

---

## API Reference (Sync Service)

- **`POST /transcribe`**: Accepts an audio file (UploadFile). Returns an AI-generated transcription with perfect timestamp segments.
- **`POST /align`**: Accepts an audio file (UploadFile) and raw `lyrics` (Form Data JSON string). Returns lyric lines aligned precisely to the audio using fuzzy matching and interpolation.
