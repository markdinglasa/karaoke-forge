import { fireEvent, render, screen } from "@testing-library/react";
import AudioPlayer from "./audio-player";

// Mock the global Audio element since jsdom doesn't fully support it
const mockPlay = jest.fn();
const mockPause = jest.fn();

beforeAll(() => {
  globalThis.HTMLMediaElement.prototype.play = mockPlay;
  globalThis.HTMLMediaElement.prototype.pause = mockPause;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("AudioPlayer Component", () => {
  it("renders correctly with default props", () => {
    render(<AudioPlayer src="test.mp3" />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: /audio position/i }),
    ).toBeInTheDocument();
  });

  it("toggles play/pause state", () => {
    render(<AudioPlayer src="test.mp3" />);
    const button = screen.getByRole("button", { name: /play/i });

    fireEvent.click(button);
    expect(mockPlay).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-label", "Pause");

    fireEvent.click(button);
    expect(mockPause).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-label", "Play");
  });

  it("renders the tap button when showTapButton is true", () => {
    render(<AudioPlayer src="test.mp3" showTapButton={true} tapLabel="SYNC" />);
    const tapButton = screen.getByRole("button", {
      name: /tap to sync lyric line/i,
    });
    expect(tapButton).toBeInTheDocument();
    expect(tapButton).toHaveTextContent(/SYNC/i);
  });

  it("calls onTap when the tap button is clicked", () => {
    const mockOnTap = jest.fn();
    render(
      <AudioPlayer src="test.mp3" showTapButton={true} onTap={mockOnTap} />,
    );

    const tapButton = screen.getByRole("button", {
      name: /tap to sync lyric line/i,
    });
    fireEvent.click(tapButton);

    expect(mockOnTap).toHaveBeenCalledTimes(1);
  });

  it("handles spacebar press when showTapButton is true", () => {
    const mockOnTap = jest.fn();
    render(
      <AudioPlayer src="test.mp3" showTapButton={true} onTap={mockOnTap} />,
    );

    // Simulate spacebar keydown
    fireEvent.keyDown(globalThis as unknown as Element, { code: "Space" });

    expect(mockOnTap).toHaveBeenCalledTimes(1);
  });
});
