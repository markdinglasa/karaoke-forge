"use client";

import { WizardState } from "@/app/create/page";
import ProgressBar from "@/components/ui/progress-bar";
import { useCallback, useEffect, useRef, useState } from "react";

interface Step4Props {
  state: WizardState;
  onBack: () => void;
  onReset: () => void;
}

type GenStatus = "idle" | "generating" | "done" | "error";

export default function Step4Generate(props: Readonly<Step4Props>) {
  const { state, onBack, onReset } = props;
  const [status, setStatus] = useState<GenStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Live Preview State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const updatePreviewTime = useCallback(function updatePreviewTime() {
    if (audioRef.current) {
      setPreviewTime(audioRef.current.currentTime);
    }
    rafRef.current = requestAnimationFrame(updatePreviewTime);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updatePreviewTime);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updatePreviewTime]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPreviewTime(time);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const startGeneration = async () => {
    if (!state.jobId) {
      setErrorMsg("No job ID — please restart the wizard.");
      return;
    }

    setStatus("generating");
    setProgress(0);
    setMessage("Starting...");
    setErrorMsg(null);
    setDownloadUrl(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: state.jobId,
          lyrics: state.lyrics,
          settings: state.settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      // Start polling for status
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/status/${state.jobId}`);
          const statusData = await statusRes.json();

          setProgress(statusData.progress ?? 0);
          setMessage(statusData.message ?? "");

          if (statusData.status === "done") {
            stopPolling();
            setStatus("done");
            setProgress(100);
            setDownloadUrl(statusData.downloadUrl);
          } else if (statusData.status === "error") {
            stopPolling();
            setStatus("error");
            setErrorMsg(
              statusData.message || "Unknown error during generation",
            );
          }
        } catch {
          // Network hiccup — keep polling
        }
      }, 2000);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Generation failed");
    }
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `karaoke-${state.jobId?.slice(0, 8)}.mp4`;
    a.click();
  };

  return (
    <div className="glass-card" style={{ padding: "40px 36px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
        Generate Your Video
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: 36,
          fontSize: "0.95rem",
        }}
      >
        Review your settings and click Generate to create your karaoke video.
      </p>

      {/* Live Preview Panel */}
      {state.audioUrl && (
        <div style={{ marginBottom: 32 }}>
          <audio
            ref={audioRef}
            src={state.audioUrl}
            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration)}
            onEnded={() => setIsPlaying(false)}
            style={{ display: "none" }}
          />
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              backgroundColor: "#000",
              borderRadius: 12,
              overflow: "hidden",
              backgroundImage: `url(${
                previewTime < state.settings.introDurationSec
                  ? state.thumbnailPreview
                  : state.backgroundPreview
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "center",
              paddingBottom: "8%",
            }}
          >
            {/* Lyrics Overlay */}
            {previewTime >= state.settings.introDurationSec && (
              <div
                style={{
                  textAlign: "center",
                  fontFamily: state.settings.fontName,
                  fontSize: `${Math.max(16, state.settings.fontSize * 0.4)}px`,
                  fontWeight: 700,
                  textShadow: state.settings.outlineEnabled
                    ? "2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000, 0 4px 10px rgba(0,0,0,0.8)"
                    : "0 4px 10px rgba(0,0,0,0.8)",
                  width: "90%",
                  lineHeight: 1.4,
                  transition: "color 0.1s ease",
                }}
              >
                {(() => {
                  const currentMs = previewTime * 1000;
                  const activeIdx = state.lyrics.findIndex(
                    (l) => currentMs >= l.startMs && currentMs < l.endMs,
                  );

                  if (activeIdx === -1) return null;

                  const prevLine =
                    activeIdx > 0 ? state.lyrics[activeIdx - 1] : null;
                  const currentLine = state.lyrics[activeIdx];
                  const nextLine =
                    activeIdx < state.lyrics.length - 1
                      ? state.lyrics[activeIdx + 1]
                      : null;

                  return (
                    <>
                      {/* Previous line (dimmed) */}
                      {prevLine && (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.8em",
                          }}
                        >
                          {prevLine.text}
                        </div>
                      )}

                      {/* Current active line */}
                      <div
                        style={{
                          color: state.settings.highlightColor,
                          fontSize: "1.2em",
                          margin: "4px 0",
                        }}
                      >
                        {currentLine.text}
                      </div>

                      {/* Next line (dimmed) */}
                      {nextLine && (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "0.9em",
                          }}
                        >
                          {nextLine.text}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: 16,
            }}
          >
            <button
              onClick={togglePlay}
              className="btn btn-secondary"
              style={{ padding: "8px 16px", minWidth: 100 }}
            >
              {isPlaying ? "⏸ Pause" : "▶️ Play"}
            </button>
            <input
              type="range"
              min={0}
              max={audioDuration || 100}
              step={0.1}
              value={previewTime}
              onChange={(e) => handleSeek(Number.parseFloat(e.target.value))}
              style={{ flex: 1, cursor: "pointer" }}
            />
            <span
              style={{
                fontFamily: "monospace",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                minWidth: 45,
              }}
            >
              {Math.floor(previewTime / 60)}:
              {Math.floor(previewTime % 60)
                .toString()
                .padStart(2, "0")}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { label: "Lyric Lines", value: state.lyrics.length },
          { label: "Resolution", value: state.settings.resolution },
          { label: "Font", value: state.settings.fontName },
          { label: "Intro", value: `${state.settings.introDurationSec}s` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              {stat.label}
            </p>
            <p style={{ fontWeight: 700, fontSize: "1rem" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Color preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
          padding: "12px 16px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: state.settings.highlightColor,
            flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.2)",
          }}
        />
        <div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Highlight Color
          </p>
          <p style={{ fontWeight: 600, color: state.settings.highlightColor }}>
            {state.settings.highlightColor}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
            }}
          >
            Outline: {state.settings.outlineEnabled ? "✓ On" : "✗ Off"}
          </span>
        </div>
      </div>

      {/* ── IDLE ── */}
      {status === "idle" && (
        <button
          className="btn btn-primary btn-lg"
          style={{ width: "100%" }}
          onClick={startGeneration}
          id="btn-generate"
        >
          Generate Karaoke Video
        </button>
      )}

      {/* ── GENERATING ── */}
      {status === "generating" && (
        <div>
          <ProgressBar
            progress={progress}
            label={message || "Generating your video..."}
            showPercentage
          />
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.82rem",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            ⏳ This may take 1–3 minutes depending on song length. Please keep
            this tab open.
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {status === "done" && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "4rem",
              marginBottom: 16,
              animation: "scaleIn 0.4s ease",
            }}
          >
            🎉
          </div>
          <h3 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
            Your karaoke video is ready!
          </h3>
          <p style={{ color: "var(--text-secondary)", marginBottom: 28 }}>
            {state.lyrics.length} lyrics synced — download your MP4 below
          </p>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: "100%", marginBottom: 12 }}
            onClick={handleDownload}
            id="btn-download"
          >
            ⬇ Download Karaoke Video (.mp4)
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: "100%" }}
            onClick={onReset}
            id="btn-start-over"
          >
            🔄 Create Another Video
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {status === "error" && (
        <div>
          <div
            className="badge badge-error"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              fontSize: "0.88rem",
              marginBottom: 16,
              display: "block",
              width: "100%",
            }}
          >
            ⚠ Error: {errorMsg}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={startGeneration}
              id="btn-retry"
            >
              🔁 Retry
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onReset}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Back */}
      {status === "idle" && (
        <button
          className="btn btn-ghost"
          style={{ marginTop: 16, width: "100%" }}
          onClick={onBack}
          id="step4-back"
        >
          ← Back to Settings
        </button>
      )}
    </div>
  );
}
