"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationLoad?: (duration: number) => void;
  showTapButton?: boolean;
  onTap?: (currentTime: number) => void;
  tapLabel?: string;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  const ms = Math.floor((secs % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export default function AudioPlayer(props: Readonly<AudioPlayerProps>) {
  const {
    src,
    onTimeUpdate,
    onDurationLoad,
    showTapButton,
    onTap,
    tapLabel = "TAP",
  } = props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const onLoad = () => {
      setDuration(audio.duration);
      onDurationLoad?.(audio.duration);
    };

    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("ended", onEnded);
    };
  }, [onTimeUpdate, onDurationLoad]);

  const handleTap = () => {
    if (!audioRef.current) return;
    const t = audioRef.current.currentTime;
    onTap?.(t);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 200);
  };

  // Global spacebar tap when player is active
  useEffect(() => {
    if (!showTapButton) return;
    const handler = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        handleTap();
      }
    };
    globalThis.addEventListener("keydown", handler);
    return () => globalThis.removeEventListener("keydown", handler);
  });

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number.parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };


  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="audio-controls">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="btn btn-primary btn-icon"
          aria-label={playing ? "Pause" : "Play"}
          style={{ minWidth: 44 }}
        >
          {playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 2l11 6-11 6V2z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="audio-time">{formatTime(currentTime)}</span>

        {/* Scrubber */}
        <input
          type="range"
          className="audio-scrubber"
          min={0}
          max={duration || 100}
          step={0.01}
          value={currentTime}
          onChange={handleSeek}
          aria-label="Audio position"
        />

        <span className="audio-time" style={{ textAlign: "right" }}>
          {formatTime(duration)}
        </span>
      </div>

      {showTapButton && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            onClick={handleTap}
            className="btn btn-primary btn-lg"
            style={{
              width: "100%",
              transition: "all 0.15s ease",
              background: flashing
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : undefined,
            }}
            aria-label="Tap to sync lyric line"
          >
            🎤 {tapLabel} —{" "}
            <kbd style={{ opacity: 0.7, fontSize: "0.8em" }}>SPACE</kbd>
          </button>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: 8,
            }}
          >
            Press <strong>Spacebar</strong> or click the button when each line
            starts
          </p>
        </div>
      )}
    </div>
  );
}
