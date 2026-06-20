import { WizardState } from "@/app/create/page";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Step2Lyrics from "./step2-lyrics";

jest.mock("@/components/ui/audio-player", () => {
  return function MockAudioPlayer(props: any) {
    return (
      <div data-testid="audio-player">
        <button onClick={() => props.onDurationLoad?.(120)}>
          Load Duration
        </button>
        <button onClick={() => props.onTap?.(10)}>Tap Sync</button>
      </div>
    );
  };
});

describe("Step2Lyrics Component", () => {
  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();

  const defaultState: WizardState = {
    thumbnailFile: null,
    thumbnailPreview: null,
    backgroundFile: null,
    backgroundPreview: null,
    audioFile: null,
    audioUrl: "blob:dummy-audio",
    rawLyrics: "",
    tapLines: [],
    tapCurrentLineIndex: 0,
    manualInputs: [],
    syncTab: "tap",
    lyrics: [],
    settings: {
      resolution: "1920x1080",
      fontName: "Arial",
      fontSize: 48,
      highlightColor: "#10b981",
      outlineEnabled: true,
      introDurationSec: 5,
    },
    jobId: "job-123",
  };

  beforeAll(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(
      <Step2Lyrics
        state={defaultState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />,
    );
    expect(screen.getByText("Sync Your Lyrics")).toBeInTheDocument();
  });

  it("parses raw lyrics into lines when text is pasted", () => {
    render(
      <Step2Lyrics
        state={defaultState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />,
    );

    const textarea = screen.getByPlaceholderText(/Never gonna give you up/i);
    fireEvent.change(textarea, { target: { value: "Line 1\nLine 2" } });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        rawLyrics: "Line 1\nLine 2",
        tapLines: [
          { text: "Line 1", startMs: -1 },
          { text: "Line 2", startMs: -1 },
        ],
        tapCurrentLineIndex: 0,
      }),
    );
  });

  it("calls auto-sync API correctly", async () => {
    const stateWithLines = {
      ...defaultState,
      tapLines: [{ text: "Line 1", startMs: -1 }],
    };

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lyrics: [{ text: "Line 1", startMs: 5000 }],
      }),
    });

    render(
      <Step2Lyrics
        state={stateWithLines}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />,
    );

    const autoSyncBtn = screen.getByRole("button", {
      name: /Magic Auto-Sync/i,
    });
    fireEvent.click(autoSyncBtn);

    expect(screen.getByText(/Syncing.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/auto-sync",
        expect.any(Object),
      );
      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          syncTab: "manual",
          tapLines: [{ text: "Line 1", startMs: 5000 }],
        }),
      );
    });
  });

  it("handles manual timestamp entry", () => {
    const stateWithManual = {
      ...defaultState,
      syncTab: "manual" as const,
      tapLines: [{ text: "Line 1", startMs: -1 }],
      manualInputs: [{ time: "", text: "Line 1" }],
    };

    render(
      <Step2Lyrics
        state={stateWithManual}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />,
    );

    const timeInput = screen.getByPlaceholderText("00:15");
    fireEvent.change(timeInput, { target: { value: "00:10.50" } });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      manualInputs: [{ time: "00:10.50", text: "Line 1" }],
    });
  });
});
