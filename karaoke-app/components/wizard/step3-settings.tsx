"use client";

import { WizardState, VideoSettings } from "@/app/create/page";

interface Step3Props {
  state: WizardState;
  onUpdate: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const HIGHLIGHT_COLORS = [
  { label: "Purple", value: "#a855f7" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Green", value: "#10b981" },
  { label: "Yellow", value: "#f59e0b" },
  { label: "Pink", value: "#ec4899" },
  { label: "Red", value: "#ef4444" },
  { label: "White", value: "#ffffff" },
];

const FONTS = [
  { label: "Arial (Default)", value: "Arial" },
  { label: "Impact (Bold)", value: "Impact" },
  { label: "Georgia (Serif)", value: "Georgia" },
  { label: "Courier New (Mono)", value: "Courier New" },
];

const RESOLUTIONS = [
  { label: "Full HD — 1920×1080", value: "1920x1080" },
  { label: "HD — 1280×720", value: "1280x720" },
];

export default function Step3Settings(props: Readonly<Step3Props>) {
  const { state, onUpdate, onNext, onBack } = props
  const settings = state.settings;

  const update = (partial: Partial<VideoSettings>) => {
    onUpdate({ settings: { ...settings, ...partial } });
  };

  return (
    <div className="glass-card" style={{ padding: "40px 36px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>Video Settings</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 36, fontSize: "0.95rem" }}>
        Customize the look and feel of your karaoke video.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {/* Resolution */}
        <div className="form-group">
          <label className="form-label" htmlFor="setting-resolution">
            🎬 Video Resolution
          </label>
          <select
            id="setting-resolution"
            className="form-select"
            value={settings.resolution}
            onChange={(e) => update({ resolution: e.target.value })}
          >
            {RESOLUTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="divider" />

        {/* Font */}
        <div className="form-group">
          <label className="form-label" htmlFor="setting-font">
            🔤 Lyric Font
          </label>
          <select
            id="setting-font"
            className="form-select"
            value={settings.fontName}
            onChange={(e) => update({ fontName: e.target.value })}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="divider" />

        {/* Font Size */}
        <div className="form-group">
          <label className="form-label" htmlFor="setting-fontsize">
            📏 Font Size —{" "}
            <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              {settings.fontSize}px
            </span>
          </label>
          <input
            id="setting-fontsize"
            type="range"
            className="slider-input"
            min={32}
            max={80}
            step={2}
            value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number.parseInt(e.target.value) })}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            <span>Small (32px)</span>
            <span>Large (80px)</span>
          </div>
        </div>

        <div className="divider" />

        {/* Highlight Color */}
        <div className="form-group">
          <label htmlFor="color-swatches" className="form-label">🎨 Lyric Highlight Color</label>
          <div className="color-swatches">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.value}
                className={`color-swatch ${settings.highlightColor === c.value ? "selected" : ""}`}
                style={{ background: c.value }}
                onClick={() => update({ highlightColor: c.value })}
                title={c.label}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && update({ highlightColor: c.value })}
                aria-label={`${c.label} highlight color`}
              />
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
              <input
                type="color"
                value={settings.highlightColor}
                onChange={(e) => update({ highlightColor: e.target.value })}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  background: "none",
                  padding: 0,
                }}
                aria-label="Custom highlight color"
                title="Custom color"
              />
            </div>
          </div>

          {/* Preview */}
          <div
            style={{
              marginTop: 16,
              padding: "16px 24px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 10,
              textAlign: "center",
              fontFamily: settings.fontName,
              fontSize: Math.round(settings.fontSize * 0.6),
            }}
          >
            <p style={{ color: "rgba(255,255,255,0.3)", marginBottom: 6, fontSize: "0.75em" }}>
              Previous lyric line
            </p>
            <p style={{ color: settings.highlightColor, fontWeight: 700, fontSize: "1em" }}>
              ♪ This is the active lyric line ♪
            </p>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 6, fontSize: "0.75em" }}>
              Next lyric line
            </p>
          </div>
        </div>

        <div className="divider" />

        {/* Intro Duration */}
        <div className="form-group">
          <label className="form-label" htmlFor="setting-intro">
            🎬 Intro Duration (thumbnail shown) —{" "}
            <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
              {settings.introDurationSec}s
            </span>
          </label>
          <input
            id="setting-intro"
            type="range"
            className="slider-input"
            min={2}
            max={10}
            step={1}
            value={settings.introDurationSec}
            onChange={(e) => update({ introDurationSec: Number.parseInt(e.target.value) })}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: 4,
            }}
          >
            <span>2 seconds</span>
            <span>10 seconds</span>
          </div>
        </div>

        <div className="divider" />

        {/* Outline Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <p className="form-label" style={{ marginBottom: 2 }}>
              🔲 Text Outline / Shadow
            </p>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Adds a dark outline to improve readability on bright backgrounds
            </p>
          </div>
          <button
            onClick={() => update({ outlineEnabled: !settings.outlineEnabled })}
            className={`btn ${settings.outlineEnabled ? "btn-primary" : "btn-secondary"}`}
            style={{ minWidth: 80, padding: "10px 20px" }}
            id="toggle-outline"
            aria-pressed={settings.outlineEnabled}
          >
            {settings.outlineEnabled ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <button className="btn btn-ghost" onClick={onBack} id="step3-back">
          ← Back
        </button>
        <button className="btn btn-primary btn-lg" onClick={onNext} id="step3-next">
          Next: Generate →
        </button>
      </div>
    </div>
  );
}
