import { render, screen } from "@testing-library/react";
import ProgressBar from "./progress-bar";

describe("ProgressBar Component", () => {
  it("renders correctly with default props", () => {
    render(<ProgressBar progress={50} />);
    expect(screen.getByText("50%")).toBeInTheDocument();

    const progressElement = document.querySelector("progress");
    expect(progressElement).toBeInTheDocument();
    expect(progressElement).toHaveStyle({ width: "50%" });
  });

  it("clamps progress to 0-100 range", () => {
    const { rerender } = render(<ProgressBar progress={-10} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(document.querySelector("progress")).toHaveStyle({ width: "0%" });

    rerender(<ProgressBar progress={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(document.querySelector("progress")).toHaveStyle({ width: "100%" });
  });

  it("renders an optional label", () => {
    render(<ProgressBar progress={25} label="Uploading..." />);
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
  });

  it("hides percentage when showPercentage is false", () => {
    render(
      <ProgressBar progress={25} label="Uploading..." showPercentage={false} />,
    );
    expect(screen.getByText("Uploading...")).toBeInTheDocument();
    expect(screen.queryByText("25%")).not.toBeInTheDocument();
  });
});
