"use client";

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar(props: Readonly<ProgressBarProps>) {
  const {
  progress,
  label,
  showPercentage = true,
}= props
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div style={{ width: "100%" }}>
      {(label || showPercentage) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {label && (
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--color-primary)",
              }}
            >
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}
      <div className="progress-bar-track">
        <progress
          className="progress-bar-fill"
          style={{ width: `${clampedProgress}%` }}
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
