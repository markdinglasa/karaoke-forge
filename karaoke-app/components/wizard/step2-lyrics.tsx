"use client";

import { LyricLine, WizardState } from "@/app/create/page";
import AudioPlayer from "@/components/ui/audio-player";
import { useCallback, useState } from "react";

interface Step2Props {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

type TabMode = "tap" | "manual";

function msToDisplay(ms: number): string {
  if (ms < 0) return "--:--";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function parseManualTime(input: string): number {
  // Accepts: mm:ss, mm:ss.cs, m:ss
  const match = /^(\d{1,2}):(\d{2})(?:\.(\d{1,2}))?$/.exec(input);
  if (!match) return -1;
  const m = Number.parseInt(match[1]);
  const s = Number.parseInt(match[2]);
  const cs = Number.parseInt(match[3] || "0");
  return (m * 60 + s) * 1000 + cs * 10;
}

export default function Step2Lyrics(props: Readonly<Step2Props>) {
  const { state, onUpdate, onNext, onBack } = props;
  // Use global state for draft preservation
  const tab = state.syncTab;
  const setTab = (t: TabMode) => onUpdate({ syncTab: t });

  const rawLyrics = state.rawLyrics;
  const manualInputs = state.manualInputs;
  const lines = state.tapLines;
  const currentLineIndex = state.tapCurrentLineIndex;

  const [audioDuration, setAudioDuration] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Parse raw lyrics into line array
  const parseLyrics = useCallback((raw: string) => {
    return raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((text) => ({ text, startMs: -1 }));
  }, []);

  const handleRawChange = (val: string) => {
    const parsed = parseLyrics(val);

    // Auto-fill manual inputs if they don't match line count, but preserve existing
    const newManualInputs = parsed.map((p, i) => {
      if (state.manualInputs[i]) {
        return { ...state.manualInputs[i], text: p.text };
      }
      return { text: p.text, time: "" };
    });

    onUpdate({
      rawLyrics: val,
      tapLines: parsed,
      tapCurrentLineIndex: 0,
      manualInputs: newManualInputs,
    });
  };

  const handleAutoSync = async () => {
    if (!state.jobId || lines.length === 0) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/auto-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: state.jobId,
          lyrics: lines.map((l) => l.text),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-sync failed");

      // Update manual inputs and tap lines with the received timestamps
      const newManualInputs = data.lyrics.map(
        (l: { text: string; startMs: number }) => ({
          text: l.text,
          time: msToDisplay(l.startMs),
        }),
      );
      const newTapLines = data.lyrics.map(
        (l: { text: string; startMs: number }) => ({
          text: l.text,
          startMs: l.startMs,
        }),
      );

      onUpdate({
        manualInputs: newManualInputs,
        tapLines: newTapLines,
        syncTab: "manual",
      });
    } catch (err: unknown) {
      setSyncError((err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoDetect = async () => {
    if (!state.jobId) return;
    setIsDetecting(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/auto-transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: state.jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Auto-detect failed");

      const newRawLyrics = data.lyrics
        .map((l: { text: string; startMs: number }) => l.text)
        .join("\n");
      const newManualInputs = data.lyrics.map(
        (l: { text: string; startMs: number }) => ({
          text: l.text,
          time: msToDisplay(l.startMs),
        }),
      );
      const newTapLines = data.lyrics.map(
        (l: { text: string; startMs: number }) => ({
          text: l.text,
          startMs: l.startMs,
        }),
      );

      onUpdate({
        rawLyrics: newRawLyrics,
        manualInputs: newManualInputs,
        tapLines: newTapLines,
        tapCurrentLineIndex: 0,
        syncTab: "manual",
      });
    } catch (err: unknown) {
      setSyncError((err as Error).message);
    } finally {
      setIsDetecting(false);
    }
  };

  // TAP SYNC: stamp current time to current line
  const handleTap = useCallback(
    (currentTime: number) => {
      if (currentLineIndex >= lines.length) return;
      const ms = Math.round(currentTime * 1000);

      const newLines = [...lines];
      newLines[currentLineIndex] = {
        ...newLines[currentLineIndex],
        startMs: ms,
      };

      const nextInputs = [...state.manualInputs];
      if (nextInputs[currentLineIndex]) {
        nextInputs[currentLineIndex] = {
          ...nextInputs[currentLineIndex],
          time: msToDisplay(ms),
        };
      }

      onUpdate({
        tapLines: newLines,
        manualInputs: nextInputs,
        tapCurrentLineIndex: Math.min(currentLineIndex + 1, lines.length - 1),
      });
    },
    [currentLineIndex, lines, state.manualInputs, onUpdate],
  );

  // Build final lyrics array with endMs calculated
  const buildFinalLyrics = useCallback(
    (sourceLines: { text: string; startMs: number }[]): LyricLine[] => {
      return sourceLines.map((line, i) => ({
        text: line.text,
        startMs: line.startMs,
        endMs:
          i < sourceLines.length - 1
            ? sourceLines[i + 1].startMs
            : Math.round(audioDuration * 1000),
      }));
    },
    [audioDuration],
  );

  // Validate tap sync: all lines must have timestamps
  const tapSyncReady = lines.length > 0 && lines.every((l) => l.startMs >= 0);

  // Validate manual: all rows must have valid time + non-empty text
  const manualReady =
    manualInputs.length > 0 &&
    manualInputs.every(
      (row) => parseManualTime(row.time) >= 0 && row.text.trim().length > 0,
    );

  const canProceed = tab === "tap" ? tapSyncReady : manualReady;

  const handleNext = () => {
    let finalLines: LyricLine[] = [];

    if (tab === "tap") {
      finalLines = buildFinalLyrics(lines);
    } else {
      const sorted = [...manualInputs]
        .filter((r) => parseManualTime(r.time) >= 0 && r.text.trim())
        .sort((a, b) => parseManualTime(a.time) - parseManualTime(b.time));
      finalLines = sorted.map((row, i) => ({
        text: row.text.trim(),
        startMs: parseManualTime(row.time),
        endMs:
          i < sorted.length - 1
            ? parseManualTime(sorted[i + 1].time)
            : Math.round(audioDuration * 1000),
      }));
    }

    onUpdate({ lyrics: finalLines });
    onNext();
  };

  // Manual row helpers
  const addManualRow = () =>
    onUpdate({ manualInputs: [...state.manualInputs, { time: "", text: "" }] });

  const removeManualRow = (i: number) =>
    onUpdate({
      manualInputs: state.manualInputs.filter((_, idx) => idx !== i),
    });

  const updateManualRow = (
    i: number,
    field: "time" | "text",
    value: string,
  ) => {
    const next = [...state.manualInputs];
    next[i] = { ...next[i], [field]: value };
    onUpdate({ manualInputs: next });
  };

  return (
    <div className="glass-card" style={{ padding: "40px 36px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Sync Your Lyrics</h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: 28,
          fontSize: "0.95rem",
        }}
      >
        Paste your lyrics then use Tap-to-Sync or enter timestamps manually.
      </p>

      {/* Lyrics Textarea */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <label
            className="form-label"
            htmlFor="lyrics-input"
            style={{ marginBottom: 0 }}
          >
            Paste Lyrics (one line per lyric line)
          </label>
          {state.audioUrl && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleAutoDetect}
              disabled={isDetecting}
              style={{
                padding: "4px 12px",
                fontSize: "0.8rem",
                background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
                color: "#fff",
                border: "none",
              }}
            >
              {isDetecting ? "⏳ Detecting..." : "🎤 Auto-Detect Lyrics"}
            </button>
          )}
        </div>
        <textarea
          id="lyrics-input"
          className="form-input form-textarea"
          value={rawLyrics}
          onChange={(e) => handleRawChange(e.target.value)}
          placeholder={
            "Never gonna give you up\nNever gonna let you down\nNever gonna run around\nAnd desert you"
          }
          style={{ minHeight: 140 }}
        />
        {lines.length > 0 && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            ✓ {lines.length} lyric lines detected
          </p>
        )}
      </div>

      {/* Mode Tabs & Auto-Sync */}
      {lines.length > 0 && state.audioUrl && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div className="tab-bar" style={{ marginBottom: 0 }}>
              <button
                className={`tab-btn ${tab === "tap" ? "active" : ""}`}
                onClick={() => setTab("tap")}
                id="tab-tap-sync"
              >
                🎯 Tap-to-Sync
              </button>
              <button
                className={`tab-btn ${tab === "manual" ? "active" : ""}`}
                onClick={() => setTab("manual")}
                id="tab-manual"
              >
                ✏️ Manual Timestamps
              </button>
            </div>
            <button
              className="btn btn-secondary"
              onClick={handleAutoSync}
              disabled={isSyncing}
              style={{
                background: "linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)",
                color: "#fff",
                border: "none",
              }}
            >
              {isSyncing ? "⏳ Syncing..." : "✨ Magic Auto-Sync"}
            </button>
          </div>

          {syncError && (
            <div className="badge badge-error" style={{ marginBottom: 16 }}>
              ⚠ {syncError}
            </div>
          )}

          {/* ── TAP SYNC ── */}
          {tab === "tap" && (
            <div className="animate-fade">
              <AudioPlayer
                src={state.audioUrl}
                onDurationLoad={setAudioDuration}
                showTapButton={true}
                onTap={handleTap}
                tapLabel={
                  currentLineIndex < lines.length
                    ? `TAP: "${lines[currentLineIndex]?.text.slice(0, 30)}..."`
                    : "All lines synced! ✓"
                }
              />

              <div
                style={{
                  marginTop: 20,
                  maxHeight: 320,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {lines.map((line, i) => (
                  <div
                    key={"line-" + i}
                    className={`lyric-row ${i === currentLineIndex ? "current" : ""}`}
                    id={`lyric-line-${i}`}
                  >
                    <span className="lyric-timestamp">
                      {line.startMs >= 0
                        ? msToDisplay(line.startMs)
                        : "--:--.--"}
                    </span>
                    <span className="lyric-text">{line.text}</span>
                    {line.startMs >= 0 && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const newLines = [...lines];
                          newLines[i] = { ...newLines[i], startMs: -1 };
                          onUpdate({
                            tapLines: newLines,
                            tapCurrentLineIndex: i,
                          });
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "0.75rem",
                          opacity: 0.6,
                        }}
                        aria-label="Reset timestamp"
                      >
                        ↩
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {tapSyncReady && (
                <p
                  className="badge badge-success"
                  style={{ marginTop: 16, display: "inline-flex" }}
                >
                  ✓ All {lines.length} lines synced!
                </p>
              )}
            </div>
          )}

          {/* ── MANUAL ── */}
          {tab === "manual" && (
            <div className="animate-fade">
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.82rem",
                  marginBottom: 16,
                }}
              >
                Format:{" "}
                <code style={{ color: "var(--color-primary)" }}>mm:ss</code> or{" "}
                <code style={{ color: "var(--color-primary)" }}>mm:ss.cs</code>
              </p>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {manualInputs.map((row, i) => (
                  <div
                    key={"inputs-" + i}
                    style={{ display: "flex", gap: 10, alignItems: "center" }}
                  >
                    <input
                      className="form-input"
                      style={{ width: 110, flexShrink: 0 }}
                      placeholder="00:15"
                      value={row.time}
                      onChange={(e) =>
                        updateManualRow(i, "time", e.target.value)
                      }
                      aria-label={`Timestamp for line ${i + 1}`}
                    />
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Lyric line..."
                      value={row.text}
                      onChange={(e) =>
                        updateManualRow(i, "text", e.target.value)
                      }
                      aria-label={`Lyric text for line ${i + 1}`}
                    />
                    {manualInputs.length > 1 && (
                      <button
                        className="btn btn-danger btn-icon"
                        onClick={() => removeManualRow(i)}
                        aria-label="Remove row"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: 12 }}
                onClick={addManualRow}
                id="add-lyric-row"
              >
                + Add Line
              </button>
            </div>
          )}
        </>
      )}

      {lines.length > 0 && !state.audioUrl && (
        <div
          className="badge badge-error"
          style={{ padding: "10px 16px", borderRadius: 8 }}
        >
          ⚠ No audio file found. Please go back and upload an MP3.
        </div>
      )}

      {/* Nav Buttons */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button className="btn btn-ghost" onClick={onBack} id="step2-back">
          ← Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleNext}
          disabled={!canProceed}
          id="step2-next"
        >
          Next: Settings →
        </button>
      </div>
    </div>
  );
}
