import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import CertPage from "./pages/CertPage";

test("renders cert page and validates input", () => {
  render(<BrowserRouter><CertPage /></BrowserRouter>);
  expect(screen.getByPlaceholderText(/이름/)).toBeInTheDocument();
  expect(screen.getByText(/인증/)).toBeInTheDocument();
});
