"use client";

import StepIndicator from "@/components/ui/step-indicator";
import Step1Assets from "@/components/wizard/step1-assets";
import Step2Lyrics from "@/components/wizard/step2-lyrics";
import Step3Settings from "@/components/wizard/step3-settings";
import Step4Generate from "@/components/wizard/step4-generate";
import Link from "next/link";
import { useCallback, useState } from "react";

export interface LyricLine {
  text: string;
  startMs: number;
  endMs: number;
}

export interface VideoSettings {
  resolution: string;
  fontName: string;
  fontSize: number;
  highlightColor: string;
  introDurationSec: number;
  outlineEnabled: boolean;
}

export interface WizardState {
  jobId: string | null;
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  backgroundFile: File | null;
  backgroundPreview: string | null;
  audioFile: File | null;
  audioUrl: string | null;
  lyrics: LyricLine[];
  settings: VideoSettings;
  // Step 2 Draft State
  rawLyrics: string;
  manualInputs: { time: string; text: string }[];
  syncTab: "tap" | "manual";
  tapLines: { text: string; startMs: number }[];
  tapCurrentLineIndex: number;
}

const STEPS = [
  { label: "Assets" },
  { label: "Lyrics" },
  { label: "Settings" },
  { label: "Generate" },
];

const DEFAULT_SETTINGS: VideoSettings = {
  resolution: "1920x1080",
  fontName: "Arial",
  fontSize: 52,
  highlightColor: "#a855f7",
  introDurationSec: 4,
  outlineEnabled: true,
};

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    jobId: null,
    thumbnailFile: null,
    thumbnailPreview: null,
    backgroundFile: null,
    backgroundPreview: null,
    audioFile: null,
    audioUrl: null,
    lyrics: [],
    settings: DEFAULT_SETTINGS,
    rawLyrics: "",
    manualInputs: [{ time: "", text: "" }],
    syncTab: "tap",
    tapLines: [],
    tapCurrentLineIndex: 0,
  });

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const goNext = () => setStep((s) => Math.min(4, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const resetWizard = () => {
    setState({
      jobId: null,
      thumbnailFile: null,
      thumbnailPreview: null,
      backgroundFile: null,
      backgroundPreview: null,
      audioFile: null,
      audioUrl: null,
      lyrics: [],
      settings: DEFAULT_SETTINGS,
      rawLyrics: "",
      manualInputs: [{ time: "", text: "" }],
      syncTab: "tap",
      tapLines: [],
      tapCurrentLineIndex: 0,
    });
    setStep(1);
  };

  return (
    <main style={{ minHeight: "100vh", padding: "40px 0 80px" }}>
      <div className="container-narrow">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 48,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--text-secondary)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M11 14L6 9l5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              background: "var(--grad-primary)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            🎤 KaraokeForge
          </h1>
          <div style={{ width: 60 }} /> {/* spacer */}
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} steps={STEPS} />

        {/* Step Content */}
        <div className="animate-scale" key={step}>
          {step === 1 && (
            <Step1Assets state={state} onUpdate={updateState} onNext={goNext} />
          )}
          {step === 2 && (
            <Step2Lyrics
              state={state}
              onUpdate={updateState}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <Step3Settings
              state={state}
              onUpdate={updateState}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step4Generate
              state={state}
              onBack={goBack}
              onReset={resetWizard}
            />
          )}
        </div>
      </div>
    </main>
  );
}
