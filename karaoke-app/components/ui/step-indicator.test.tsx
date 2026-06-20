import { render, screen } from "@testing-library/react";
import StepIndicator from "./step-indicator";

describe("StepIndicator Component", () => {
  const steps = [{ label: "Step 1" }, { label: "Step 2" }, { label: "Step 3" }];

  it("renders all steps with their labels", () => {
    render(<StepIndicator currentStep={1} steps={steps} />);
    expect(screen.getByText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Step 2")).toBeInTheDocument();
    expect(screen.getByText("Step 3")).toBeInTheDocument();
  });

  it("applies active class to the current step", () => {
    render(<StepIndicator currentStep={2} steps={steps} />);

    const stepLabels = screen.getAllByText(/Step \d/);
    expect(stepLabels[0]).toHaveClass("completed");
    expect(stepLabels[1]).toHaveClass("active");
    expect(stepLabels[2]).not.toHaveClass("active");
    expect(stepLabels[2]).not.toHaveClass("completed");
  });

  it("renders checkmark svg for completed steps", () => {
    const { container } = render(
      <StepIndicator currentStep={3} steps={steps} />,
    );

    // Step 1 and 2 should be completed and have svgs
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(2);

    // Step 3 should just have the number 3
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
