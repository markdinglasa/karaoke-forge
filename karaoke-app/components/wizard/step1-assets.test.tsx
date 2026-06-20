import { WizardState } from "@/app/create/page";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Step1Assets from "./step1-assets";

// Mock the child component FileDropZone to simplify testing
jest.mock("@/components/ui/file-drop-zone", () => {
  return function MockFileDropZone(props: any) {
    return (
      <div data-testid={`dropzone-${props.id}`}>
        <button
          onClick={() => {
            const file = new File(["dummy"], "test.png", { type: "image/png" });
            props.onFile(file);
          }}
        >
          Simulate File Drop
        </button>
      </div>
    );
  };
});

describe("Step1Assets Component", () => {
  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();

  const defaultState: WizardState = {
    thumbnailFile: null,
    thumbnailPreview: null,
    backgroundFile: null,
    backgroundPreview: null,
    audioFile: null,
    audioUrl: null,
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
    jobId: null,
  };

  beforeAll(() => {
    globalThis.URL.createObjectURL = jest.fn(() => "blob:dummy-url");
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(
      <Step1Assets
        state={defaultState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />,
    );
    expect(screen.getByText("Upload Your Assets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Next/i })).toBeDisabled();
  });

  it("calls onUpdate when a file is selected", () => {
    render(
      <Step1Assets
        state={defaultState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />,
    );

    // Simulate dropping a thumbnail
    const dropzones = screen.getAllByText("Simulate File Drop");
    fireEvent.click(dropzones[0]); // Thumbnail

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        thumbnailFile: expect.any(File),
        thumbnailPreview: "blob:dummy-url",
      }),
    );
  });

  it("enables the next button when all files are provided and uploads successfully", async () => {
    const readyState = {
      ...defaultState,
      thumbnailFile: new File([""], "thumb.jpg"),
      backgroundFile: new File([""], "bg.jpg"),
      audioFile: new File([""], "audio.mp3"),
    };

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ jobId: "job-123" }),
    });

    render(
      <Step1Assets
        state={readyState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />,
    );

    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    // Should show uploading state
    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(mockOnUpdate).toHaveBeenCalledWith({ jobId: "job-123" });
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  it("displays an error if the upload fails", async () => {
    const readyState = {
      ...defaultState,
      thumbnailFile: new File([""], "thumb.jpg"),
      backgroundFile: new File([""], "bg.jpg"),
      audioFile: new File([""], "audio.mp3"),
    };

    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Upload failed terribly" }),
    });

    render(
      <Step1Assets
        state={readyState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    await waitFor(() => {
      expect(screen.getByText(/Upload failed terribly/i)).toBeInTheDocument();
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });
});
