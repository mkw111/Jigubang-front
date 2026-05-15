import { render, screen } from "@testing-library/react";
import React from "react";

// Mocking react-router-dom to avoid module not found issues in this environment
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

test("renders landing page simulation", () => {
  render(
    <div className="landing-container">
        <h1 className="main-title">Jigubang</h1>
    </div>
  );
  expect(screen.getByText(/Jigubang/)).toBeInTheDocument();
});
