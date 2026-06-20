import { fireEvent, render, screen } from "@testing-library/react";
import FileDropZone from "./file-drop-zone";

describe("FileDropZone Component", () => {
  const defaultProps = {
    id: "test-dropzone",
    label: "Upload Audio",
    sublabel: "Max 50MB",
    icon: "🎵",
    accept: "audio/*",
    onFile: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default props", () => {
    render(<FileDropZone {...defaultProps} />);
    expect(screen.getByText("Upload Audio")).toBeInTheDocument();
    expect(screen.getByText("Max 50MB")).toBeInTheDocument();
    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("displays the selected file details when file prop is provided", () => {
    const file = new File(["dummy content"], "test-audio.mp3", {
      type: "audio/mp3",
    });
    render(<FileDropZone {...defaultProps} file={file} />);

    expect(screen.getByText(/✓ test-audio.mp3/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to replace/i)).toBeInTheDocument();
  });

  it("displays an image preview when preview prop is provided", () => {
    const file = new File(["dummy content"], "test-image.jpg", {
      type: "image/jpeg",
    });
    render(
      <FileDropZone
        {...defaultProps}
        file={file}
        preview="data:image/jpeg;base64,dummy"
      />,
    );

    const previewImage = screen.getByAltText("Preview");
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute("src");
    // Using string matching for Next.js Image component output
    expect(previewImage.getAttribute("src")).toMatch(
      /data:image\/jpeg;base64,dummy|dummy/,
    );
  });

  it("shows an error when the file exceeds the max size", () => {
    const largeFile = new File(
      [new ArrayBuffer(60 * 1024 * 1024)],
      "large.mp3",
      { type: "audio/mp3" },
    );
    render(<FileDropZone {...defaultProps} maxSizeMB={50} />);

    const input = document.getElementById("test-dropzone") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/File exceeds 50MB limit/i)).toBeInTheDocument();
    expect(defaultProps.onFile).not.toHaveBeenCalled();
  });

  it("calls onFile when a valid file is selected", () => {
    const validFile = new File(["dummy content"], "valid.mp3", {
      type: "audio/mp3",
    });
    render(<FileDropZone {...defaultProps} maxSizeMB={50} />);

    const input = document.getElementById("test-dropzone") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [validFile] } });

    expect(defaultProps.onFile).toHaveBeenCalledTimes(1);
    expect(defaultProps.onFile).toHaveBeenCalledWith(validFile);
  });
});
