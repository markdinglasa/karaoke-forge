from fastapi import FastAPI, UploadFile, Form
import json
import os
import tempfile
import whisper
from thefuzz import fuzz

# Add ffmpeg-static path to the environment so Whisper can find it
ffmpeg_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "karaoke-app", "node_modules", "ffmpeg-static"))
os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

app = FastAPI()

# Load whisper model globally so it stays in memory
print("Loading Whisper model (base)...")
model = whisper.load_model("base")
print("Whisper model loaded!")

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile):
    """
    Accepts an audio file, transcribes it using Whisper,
    and returns perfectly synced segments directly from the AI.
    """
    fd, temp_audio_path = tempfile.mkstemp(suffix=".mp3")
    with os.fdopen(fd, "wb") as f:
        f.write(await audio.read())

    try:
        print(f"Auto-detecting lyrics for {temp_audio_path}...")
        result = model.transcribe(temp_audio_path)
        segments = result.get("segments", [])

        if not segments:
            return {"error": "Whisper could not find any vocals/speech in the audio."}

        aligned_lyrics = []
        for seg in segments:
            text = seg.get("text", "").strip()
            if text:
                aligned_lyrics.append({
                    "text": text,
                    "startMs": int(seg.get("start", 0) * 1000),
                    "endMs": int(seg.get("end", 0) * 1000)
                })

        return {"lyrics": aligned_lyrics}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)


@app.post("/align")
async def align_lyrics(audio: UploadFile, lyrics: str = Form(...)):
    """
    Accepts an audio file and a JSON string of lyric lines.
    Returns the lyric lines with aligned startMs and endMs.
    """
    try:
        lyric_lines = json.loads(lyrics)
    except Exception as e:
        return {"error": f"Invalid JSON in lyrics: {e}"}

    # Save audio temporarily
    fd, temp_audio_path = tempfile.mkstemp(suffix=".mp3")
    with os.fdopen(fd, "wb") as f:
        f.write(await audio.read())

    try:
        # Transcribe using Whisper
        print(f"Transcribing {temp_audio_path} with word timestamps...")
        result = model.transcribe(temp_audio_path, word_timestamps=True)
        segments = result.get("segments", [])

        if not segments:
            return {"error": "Whisper could not find any vocals/speech in the audio."}

        # 1. Flatten all words
        all_words = []
        for seg in segments:
            for w in seg.get("words", []):
                word_text = w.get("word", "").strip()
                if word_text:
                    all_words.append({
                        "word": word_text,
                        "start": w["start"],
                        "end": w["end"]
                    })

        if not all_words:
            return {"error": "Could not extract word timestamps."}

        # Pass 1: Global Anchoring with Early Exit
        anchors = [None] * len(lyric_lines)
        search_idx = 0
        window_size = 150
        
        for idx, line in enumerate(lyric_lines):
            clean_line = line.strip()
            if not clean_line:
                continue

            line_words = clean_line.split()
            n_words = len(line_words)
            if n_words == 0:
                continue
            
            best_score = -1
            best_start_idx = search_idx
            best_end_idx = search_idx

            for i in range(search_idx, min(len(all_words), search_idx + window_size)):
                for seq_len in [n_words - 1, n_words, n_words + 1]:
                    if seq_len <= 0: continue
                    seq = all_words[i : i + seq_len]
                    if not seq: continue

                    seq_text = " ".join([w["word"] for w in seq])
                    score = fuzz.ratio(clean_line.lower(), seq_text.lower())
                    
                    if score > best_score:
                        best_score = score
                        best_start_idx = i
                        best_end_idx = i + len(seq) - 1
                        
                if best_score > 85:
                    break  # Early exit to prevent jumping too far to a repeated chorus
            
            if best_score > 40:
                start_ms = int(all_words[best_start_idx]["start"] * 1000)
                end_ms = int(all_words[best_end_idx]["end"] * 1000)
                if end_ms < start_ms:
                    end_ms = start_ms + 1000
                anchors[idx] = {
                    "text": clean_line,
                    "startMs": start_ms,
                    "endMs": end_ms
                }
                search_idx = best_end_idx + 1
            else:
                search_idx += n_words  # Force window to advance to prevent cascading failure

        # Pass 2: Gap Interpolation
        aligned_lyrics = []
        total_audio_ms = int(all_words[-1]["end"] * 1000) if all_words else 0
        
        for i, line in enumerate(lyric_lines):
            clean_line = line.strip()
            if not clean_line:
                continue
                
            if anchors[i] is not None:
                aligned_lyrics.append(anchors[i])
            else:
                # Find previous anchor end
                prev_end = 0
                for j in range(i - 1, -1, -1):
                    if anchors[j] is not None:
                        prev_end = anchors[j]["endMs"]
                        break
                        
                # Find next anchor start
                next_start = total_audio_ms
                for j in range(i + 1, len(lyric_lines)):
                    if anchors[j] is not None:
                        next_start = anchors[j]["startMs"]
                        break
                        
                if next_start <= prev_end:
                    next_start = prev_end + 3000
                    
                # Count how many lines are missing in this block
                missing_count = 0
                for j in range(i, len(lyric_lines)):
                    if anchors[j] is None and lyric_lines[j].strip():
                        missing_count += 1
                    else:
                        break
                        
                # Distribute the gap evenly
                gap_duration = next_start - prev_end
                time_per_line = min(gap_duration // (missing_count + 1), 3000)
                
                # Determine position in the missing block
                pos_in_gap = 1
                for j in range(i - 1, -1, -1):
                    if anchors[j] is None and lyric_lines[j].strip():
                        pos_in_gap += 1
                    else:
                        break
                        
                calc_start = prev_end + (time_per_line * pos_in_gap)
                calc_end = calc_start + time_per_line
                
                aligned_lyrics.append({
                    "text": clean_line,
                    "startMs": calc_start,
                    "endMs": calc_end
                })
                # Set this interpolated value as a pseudo-anchor for the next missing line 
                # (so the next missing line will just look back at this one)
                anchors[i] = aligned_lyrics[-1]

        return {"lyrics": aligned_lyrics}
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# to start run this script: pkill -f "uvicorn app:app" || true && source venv/bin/activate && uvicorn app:app --port 8000