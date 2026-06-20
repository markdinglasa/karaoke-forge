import { WizardState } from "@/app/create/page";
import { act, fireEvent, render, screen } from "@testing-library/react";
import Step4Generate from "./step4-generate";

jest.mock("@/components/ui/progress-bar", () => {
  return function MockProgressBar(props: any) {
    return (
      <div data-testid="progress-bar">
        {props.label} - {props.progress}%
      </div>
    );
  };
});

describe("Step4Generate Component", () => {
  const mockOnBack = jest.fn();
  const mockOnReset = jest.fn();

  const defaultState: WizardState = {
    thumbnailFile: null,
    thumbnailPreview: "blob:thumb",
    backgroundFile: null,
    backgroundPreview: "blob:bg",
    audioFile: null,
    audioUrl: "blob:audio",
    rawLyrics: "",
    tapLines: [],
    tapCurrentLineIndex: 0,
    manualInputs: [],
    syncTab: "manual",
    lyrics: [{ text: "Test Line", startMs: 0, endMs: 5000 }],
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
    globalThis.URL.createObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("renders correctly in idle state", () => {
    render(
      <Step4Generate
        state={defaultState}
        onBack={mockOnBack}
        onReset={mockOnReset}
      />,
    );
    expect(screen.getByText("Generate Your Video")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate Karaoke Video/i }),
    ).toBeInTheDocument();
  });

  it("starts generation and polls for status", async () => {
    jest.useFakeTimers();

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "processing",
          progress: 50,
          message: "Encoding audio...",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "done",
          progress: 100,
          downloadUrl: "/download/test.mp4",
        }),
      });

    render(
      <Step4Generate
        state={defaultState}
        onBack={mockOnBack}
        onReset={mockOnReset}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Generate Karaoke Video/i }),
      );
    });

    expect(screen.getByTestId("progress-bar")).toHaveTextContent(
      /Starting.../i,
    );

    // Fast forward to first poll
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // flush microtasks
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId("progress-bar")).toHaveTextContent(
      /Encoding audio... - 50%/i,
    );

    // Fast forward to second poll
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(
      screen.getByText(/Your karaoke video is ready!/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Download Karaoke Video/i }),
    ).toBeInTheDocument();
  });

  it("shows error if generation fails", async () => {
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(
      <Step4Generate
        state={defaultState}
        onBack={mockOnBack}
        onReset={mockOnReset}
      />,
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Generate Karaoke Video/i }),
      );
    });

    expect(screen.getByText(/Error: Network error/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
