"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  id: string;
  label: string;
  sublabel: string;
  icon: string;
  accept: string;
  onFile: (file: File) => void;
  file?: File | null;
  preview?: string | null;
  maxSizeMB?: number;
}
interface SelectedFileProps {
  file: File;
}
function SelectedFile(props: Readonly<SelectedFileProps>) {
  const { file } = props;
  return (
    <div style={{ position: "relative", zIndex: 1 }} className="w-full">
      <div className="drop-zone-icon">🎵</div>
      <p className="drop-zone-label" style={{ color: "var(--color-success)" }}>
        ✓ {file?.name}
      </p>
      <p className="drop-zone-sublabel">
        {(file?.size ?? 0 / (1024 * 1024)).toFixed(1)}MB — Click to replace
      </p>
    </div>
  );
}

interface DropZoneProps {
  file?: File | null;
  label: string;
  sublabel: string;
  icon: string;
}

function DropZone(props: Readonly<DropZoneProps>) {
  const { file, icon, label, sublabel } = props;
  if (file) return <SelectedFile file={file} />;
  return (
    <div style={{ width: "100%" }}>
      <div className="drop-zone-icon">{icon}</div>
      <p className="drop-zone-label">{label}</p>
      <p className="drop-zone-sublabel">{sublabel}</p>
    </div>
  );
}

export default function FileDropZone(props: Readonly<FileDropZoneProps>) {
  const {
    id,
    label,
    sublabel,
    icon,
    accept,
    onFile,
    file,
    preview,
    maxSizeMB = 50,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (incoming: File) => {
      setError(null);
      if (incoming.size > maxSizeMB * 1024 * 1024) {
        setError(`File exceeds ${maxSizeMB}MB limit`);
        return;
      }
      onFile(incoming);
    },
    [maxSizeMB, onFile],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const zoneClass = `drop-zone ${dragging ? "drag-over" : ""} ${file ? "has-file" : ""} `;

  return (
    <div style={{ width: "100%" }}>
      <button
        className={zoneClass}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        tabIndex={0}
        style={{ width: "100%" }}
        aria-label={`Upload ${label}`}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        {preview ? (
          <div style={{ position: "relative", zIndex: 1 }}>
            <Image
              src={preview}
              alt="Preview"
              width={20}
              height={100}
              style={{
                width: "100%",
                height: "120px",
                objectFit: "cover",
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            />
            <p
              className="drop-zone-label"
              style={{ color: "var(--color-success)" }}
            >
              ✓ {file?.name}
            </p>
            <p className="drop-zone-sublabel">Click to replace</p>
          </div>
        ) : (
          <DropZone file={file} icon={icon} label={label} sublabel={sublabel} />
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={handleChange}
        />
      </button>
      {error && (
        <p
          style={{
            color: "var(--color-error)",
            fontSize: "0.8rem",
            marginTop: "6px",
          }}
        >
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
