"use client";

import { WizardState } from "@/app/create/page";
import FileDropZone from "@/components/ui/file-drop-zone";
import { useState } from "react";

interface Step1Props {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

export default function Step1Assets(props: Readonly<Step1Props>) {
  const { state, onUpdate, onNext } = props;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allFilesReady =
    state.thumbnailFile && state.backgroundFile && state.audioFile;

  const handleThumbnail = (file: File) => {
    const url = URL.createObjectURL(file);
    onUpdate({ thumbnailFile: file, thumbnailPreview: url });
  };

  const handleBackground = (file: File) => {
    const url = URL.createObjectURL(file);
    onUpdate({ backgroundFile: file, backgroundPreview: url });
  };

  const handleAudio = (file: File) => {
    const url = URL.createObjectURL(file);
    onUpdate({ audioFile: file, audioUrl: url });
  };

  const handleNext = async () => {
    if (!state.thumbnailFile || !state.backgroundFile || !state.audioFile)
      return;

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("thumbnail", state.thumbnailFile);
      form.append("background", state.backgroundFile);
      form.append("audio", state.audioFile);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");

      onUpdate({ jobId: data.jobId });
      onNext();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "40px 36px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
        Upload Your Assets
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          marginBottom: 36,
          fontSize: "0.95rem",
        }}
      >
        Upload three files to get started. All images are automatically resized
        to Full HD.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Thumbnail */}
        <div>
          <label
            htmlFor="upload-thumbnail"
            className="form-label"
            style={{ marginBottom: 8, display: "block" }}
          >
            🖼 Thumbnail / Cover Image
          </label>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Shown at the beginning of the video before lyrics start
          </p>
          <FileDropZone
            id="upload-thumbnail"
            label="Drop thumbnail here"
            sublabel="JPG, PNG, WebP — max 10MB"
            icon="🎭"
            accept="image/jpeg,image/png,image/webp"
            onFile={handleThumbnail}
            file={state.thumbnailFile}
            preview={state.thumbnailPreview}
            maxSizeMB={10}
          />
        </div>

        <div className="divider" />

        {/* Background */}
        <div>
          <label
            htmlFor="upload-background"
            className="form-label"
            style={{ marginBottom: 8, display: "block" }}
          >
            🎨 Lyrics Background Image
          </label>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            Fills the entire video frame behind the karaoke lyrics
          </p>
          <FileDropZone
            id="upload-background"
            label="Drop background here"
            sublabel="JPG, PNG, WebP — max 10MB"
            icon="🌅"
            accept="image/jpeg,image/png,image/webp"
            onFile={handleBackground}
            file={state.backgroundFile}
            preview={state.backgroundPreview}
            maxSizeMB={10}
          />
        </div>

        <div className="divider" />

        {/* Audio */}
        <div>
          <label
            htmlFor="upload-audio"
            className="form-label"
            style={{ marginBottom: 8, display: "block" }}
          >
            🎵 Audio Track (MP3)
          </label>
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: 8,
            }}
          >
            The music track for your karaoke video — max 60MB
          </p>
          <FileDropZone
            id="upload-audio"
            label="Drop MP3 here"
            sublabel="MP3, WAV, M4A — max 60MB"
            icon="🎙"
            accept="audio/*"
            onFile={handleAudio}
            file={state.audioFile}
            maxSizeMB={60}
          />
        </div>
      </div>

      {error && (
        <div
          className="badge badge-error"
          style={{
            marginTop: 20,
            padding: "10px 16px",
            borderRadius: 8,
            fontSize: "0.85rem",
          }}
        >
          ⚠ {error}
        </div>
      )}

      <div
        style={{ marginTop: 36, display: "flex", justifyContent: "flex-end" }}
      >
        <button
          className="btn btn-primary btn-lg"
          onClick={handleNext}
          disabled={!allFilesReady || uploading}
          id="step1-next"
        >
          {uploading ? (
            <>
              <span className="spinner" /> Uploading...
            </>
          ) : (
            <>Next: Sync Lyrics →</>
          )}
        </button>
      </div>
    </div>
  );
}
