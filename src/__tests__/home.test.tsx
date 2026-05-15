import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the Word Complex title", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /word complex/i }),
    ).toBeInTheDocument();
  });
});
